import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronRight, FiFile, FiFolder, FiAlertCircle } from 'react-icons/fi'
import { decideOrganizationPlan, getOrganizationWorkflowPreview, getOrganizationWorkflowStatus, moveApprovedWorkflowFiles, updateWorkflowDestination } from '../../services/chatService'

const stages = [
  ['extracting', 'Content Extraction'],
  ['categorizing', 'AI Categorization'],
  ['generating_plan', 'Organization Plan'],
  ['preview_ready', 'Folder Preview Ready'],
]

function FolderNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(true)
  const isFolder = node.type === 'folder'
  return <div className="workflow-tree-node" style={{ marginLeft: depth * 16 }}>
    <button className="workflow-tree-row" onClick={() => isFolder && setOpen((value) => !value)}>
      {isFolder ? (open ? <FiChevronDown/> : <FiChevronRight/>) : <FiFile/>}
      {isFolder ? <FiFolder/> : null}<span>{node.name}</span><code>{node.path || node.proposed_path}</code>
    </button>
    {isFolder && open && node.children?.map((child, index) => <FolderNode key={`${child.name}-${index}`} node={child} depth={depth + 1}/>) }
  </div>
}

function buildDestinationTree(rootPath, files) {
  const root = { name: rootPath.split(/[\\/]/).filter(Boolean).at(-1) || rootPath, path: rootPath, type: 'folder', children: [] }
  const folders = new Map([[rootPath, root]])
  const separator = rootPath.includes('\\') ? '\\' : '/'
  for (const file of files) {
    const destination = file.proposed_path
    const normalizedRoot = rootPath.replace(/[\\/]+$/, '')
    const relative = destination.startsWith(normalizedRoot) ? destination.slice(normalizedRoot.length).replace(/^[\\/]+/, '') : ''
    const parts = relative.split(/[\\/]/).filter(Boolean)
    if (!parts.length) continue
    let parent = root
    let currentPath = normalizedRoot
    for (const segment of parts.slice(0, -1)) {
      currentPath += `${separator}${segment}`
      if (!folders.has(currentPath)) {
        const folder = { name: segment, path: currentPath, type: 'folder', children: [] }
        folders.set(currentPath, folder)
        parent.children.push(folder)
      }
      parent = folders.get(currentPath)
    }
    parent.children.push({ name: parts.at(-1), path: destination, type: 'file', ...file })
  }
  return root
}

function buildFolderPaths(organizedRoot, files) {
  const paths = new Set([organizedRoot])
  const rootKey = organizedRoot.toLowerCase().replace(/[\\/]+$/, '')
  for (const file of files) {
    let folder = file.proposed_path.replace(/[\\/][^\\/]*$/, '')
    while (folder.toLowerCase() === rootKey || folder.toLowerCase().startsWith(`${rootKey}\\`) || folder.toLowerCase().startsWith(`${rootKey}/`)) {
      paths.add(folder)
      if (folder.toLowerCase() === rootKey) break
      folder = folder.replace(/[\\/][^\\/]*$/, '')
    }
  }
  return [...paths].sort()
}

export default function WorkflowCard({ workflow: initial, onUpdate }) {
  const [workflow, setWorkflow] = useState(initial)
  const [preview, setPreview] = useState(initial.preview || null)
  const [error, setError] = useState('')
  const [view, setView] = useState('tree')
  const [decisionResult, setDecisionResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [editPath, setEditPath] = useState({})
  const [moveResult, setMoveResult] = useState(null)
  useEffect(() => {
    let alive = true
    let timer
    async function poll() {
      try {
        const status = await getOrganizationWorkflowStatus(initial.workflow_id)
        let next = { ...initial, ...status }
        if (status.status === 'preview_ready' && !preview) {
          const data = await getOrganizationWorkflowPreview(initial.workflow_id)
          next = { ...next, preview: data }
          if (alive) setPreview(data)
        }
        if (alive) { setWorkflow(next); onUpdate?.(next) }
        if (alive && !['preview_ready', 'failed'].includes(status.status)) timer = window.setTimeout(poll, 1500)
      } catch (pollError) {
        if (alive) { setError(pollError.response?.data?.detail || 'Could not retrieve workflow status.'); timer = window.setTimeout(poll, 3000) }
      }
    }
    if (!['preview_ready', 'failed'].includes(initial.status)) poll()
    else if (initial.status === 'preview_ready' && !preview) poll()
    return () => { alive = false; window.clearTimeout(timer) }
  // Poll once per workflow; status changes are managed inside this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.workflow_id])

  const extraction = workflow.extraction || {}
  const categorization = workflow.categorization || {}
  const completed = extraction.completed || 0
  const categorized = categorization.completed || 0
  const categories = [...new Set((preview?.categorized_files || []).map((file) => file.category).filter(Boolean))]
  const counts = categories.map((category) => [category, preview.categorized_files.filter((file) => file.category === category).length])
  const proposedFolders = preview?.proposed_folders || []
  async function saveDestination(file) {
    try {
      await updateWorkflowDestination(workflow.workflow_id, file.file_id, editPath[file.file_id] || file.proposed_path)
      const updatedFiles = preview.categorized_files.map((entry) => entry.file_id === file.file_id ? { ...entry, proposed_path: editPath[file.file_id] || entry.proposed_path } : entry)
      const nextPreview = { ...preview, categorized_files: updatedFiles, proposed_folders: buildFolderPaths(preview.organized_root_path, updatedFiles), tree: buildDestinationTree(preview.tree.path, updatedFiles), files_needing_review: updatedFiles.filter((entry) => entry.needs_review) }
      setPreview(nextPreview)
      onUpdate?.({ ...workflow, preview: nextPreview })
    } catch (saveError) { setError(saveError.response?.data?.detail || 'Could not update the proposed destination.') }
  }
  async function submitDecision(value) {
    setSubmitting(true)
    setError('')
    try {
      const result = await decideOrganizationPlan(workflow.workflow_id, value)
      setDecisionResult(result)
    } catch (decisionError) {
      const detail = decisionError.response?.data?.detail
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || decisionError.message || 'The plan decision failed.'))
    } finally { setSubmitting(false) }
  }
  async function submitMove() {
    const approvedFiles = preview?.categorized_files || []
    const confirmed = window.confirm(`Move ${approvedFiles.length} approved file(s) from their original paths into AI_Organized? Existing destination files will be skipped.`)
    if (!confirmed) return
    setSubmitting(true)
    setError('')
    setMoveResult({ status: 'running', files: [] })
    try {
      const result = await moveApprovedWorkflowFiles(workflow.workflow_id)
      setMoveResult(result)
    } catch (moveError) {
      const detail = moveError.response?.data?.detail
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || moveError.message || 'File movement failed.'))
      setMoveResult(null)
    } finally { setSubmitting(false) }
  }
  const folderResults = decisionResult?.folders || []
  const verifiedSuccess = decisionResult?.status === 'approved' && folderResults.length > 0 && folderResults.every((folder) => folder.exists === true && folder.is_dir === true && folder.status !== 'failed')
  const createdFolders = folderResults.filter((folder) => folder.status === 'created')
  const existingFolders = folderResults.filter((folder) => folder.status === 'already_exists')
  const failedFolders = folderResults.filter((folder) => folder.status === 'failed')
  return <section className="workflow-card">
    <strong>Your scan is complete. I’m preparing a proposed organization.</strong>
    <div className="workflow-stages">{stages.map(([key, label]) => {
      const state = workflow.status === 'failed' && workflow.stage === key ? 'Failed'
        : workflow.status === 'preview_ready' || stages.findIndex(([stage]) => stage === workflow.stage) > stages.findIndex(([stage]) => stage === key) ? 'Completed'
        : workflow.stage === key ? 'Processing' : 'Pending'
      return <div className="workflow-stage" key={key}><span>{label}</span><span>{state}</span></div>
    })}</div>
    <small>Content extraction: {completed} of {workflow.total_files || '—'} usable text results ({extraction.empty || 0} empty, {extraction.unsupported || 0} unsupported, {extraction.failed || 0} failed)</small>
    <small>AI categorization: {categorized} categorized, {categorization.low_confidence || 0} low confidence, {categorization.failed || 0} failed</small>
    {workflow.status === 'failed' && <p className="workflow-error">{workflow.error_message || 'Workflow failed.'}</p>}
    {error && <p className="workflow-error">{error}</p>}
    {preview && <>
      <div className="workflow-view-buttons">
        <button onClick={() => setView('tree')}>View structure</button><button onClick={() => setView('categories')}>Categorized files</button><button onClick={() => setView('review')}>Needs review ({preview.files_needing_review.length})</button>
      </div>
      <div className="workflow-path-list"><b>Selected source folder</b><code>{preview.source_folder_path}</code><b>Proposed AI_Organized root</b><code>{preview.organized_root_path}</code><b>Complete proposed folder paths</b>{proposedFolders.length ? proposedFolders.map((path) => <code key={path}>{path}</code>) : <span>No subfolders proposed.</span>}</div>
      {view === 'tree' && <div className="workflow-tree"><FolderNode node={preview.tree}/></div>}
      {view === 'categories' && <div className="workflow-categories">{counts.map(([category, count]) => <div key={category}><b>{category}</b><span>{count} files</span></div>)}{preview.categorized_files.map((file) => <div className="workflow-file-edit" key={file.file_id}><b>{file.file_name} · {file.category}{file.subcategory ? ` / ${file.subcategory}` : ''}</b><span>{file.description || 'No description provided.'}</span><label>Original file path</label><code>{file.original_path}</code><label>Exact approved destination file path</label><input aria-label={`Proposed path for ${file.file_name}`} value={editPath[file.file_id] ?? file.proposed_path} onChange={(event) => setEditPath((current) => ({ ...current, [file.file_id]: event.target.value }))}/><button disabled={!!decisionResult || !!moveResult} onClick={() => saveDestination(file)}>Save destination</button></div>)}<div className="workflow-path-list"><b>Proposed folder paths</b>{proposedFolders.length ? proposedFolders.map((path) => <code key={path}>{path}</code>) : <span>No folders proposed.</span>}</div></div>}
      {view === 'review' && <div className="workflow-categories">{preview.files_needing_review.length ? preview.files_needing_review.map((file) => <div key={file.file_id}><b>{file.file_name}</b><span>{file.category || 'Uncategorized'} · confidence {file.confidence ?? 'unavailable'}{file.review_reason ? ` · ${file.review_reason}` : ''}</span></div>) : <p>No files are currently marked for review.</p>}</div>}
      {!decisionResult && <small><FiAlertCircle/> No folders have been created. Approving will create only the listed folders; files will remain in their current locations.</small>}
      <div className="workflow-decisions">{!decisionResult ? <><button disabled={submitting} onClick={() => submitDecision('approve')}>{submitting ? 'Creating folders…' : 'Approve and Create Folders'}</button><button disabled={submitting} onClick={() => submitDecision('reject')}>Cancel</button></> : decisionResult.status === 'cancelled' ? <b>Plan cancelled. No folders were created.</b> : <div className="workflow-folder-results">
        {verifiedSuccess ? <b>Folders verified successfully. All listed paths exist as directories.</b> : decisionResult.status === 'creation_failed' || failedFolders.length ? <b className="workflow-error">Folder creation failed for one or more paths. The plan is not marked approved.</b> : <b className="workflow-error">Folder creation could not be verified.</b>}
        {[['Created', createdFolders], ['Already existed', existingFolders], ['Failed', failedFolders]].map(([label, folders]) => folders.length > 0 && <div className="workflow-path-list" key={label}><b>{label}</b>{folders.map((folder) => <code key={folder.path}>{folder.path}{folder.error ? ` — ${folder.error}` : ''}</code>)}</div>)}
        {verifiedSuccess && !moveResult && <button disabled={submitting} onClick={submitMove}>{submitting ? 'Moving files…' : 'Move Files'}</button>}
        {moveResult?.status === 'running' && <p>Moving approved files and verifying each filesystem operation…</p>}
        {moveResult && moveResult.status !== 'running' && <div className="workflow-folder-results"><b>Organization summary: {moveResult.moved} moved, {moveResult.failed} failed, {moveResult.skipped} skipped.</b>{[['Successfully moved', moveResult.files.filter((file) => file.status === 'moved')], ['Failed', moveResult.files.filter((file) => file.status === 'failed')], ['Skipped', moveResult.files.filter((file) => file.status === 'skipped')]].map(([label, files]) => files.length > 0 && <div className="workflow-path-list" key={label}><b>{label}</b>{files.map((file) => <code key={file.file_id}>Source: {file.source_path} → Destination: {file.destination_path}{file.error ? ` — ${file.error}` : ''}</code>)}</div>)}</div>}
        {!verifiedSuccess && decisionResult.status !== 'cancelled' && <button disabled={submitting} onClick={() => submitDecision('approve')}>{submitting ? 'Creating folders…' : 'Retry folder creation'}</button>}
      </div>}</div>
    </>}
  </section>
}
