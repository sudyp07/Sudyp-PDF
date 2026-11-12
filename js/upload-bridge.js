/* A small, dependency-free upload controller. File inputs work even if the PDF engine is unavailable. */
(() => {
  const state = { callback: null, pending: [], last: 0 };
  const isFileDrag = event => Array.from(event.dataTransfer?.types || []).includes('Files');
  const status = message => {
    const el = document.getElementById('status');
    if (el) { el.textContent = message; el.classList.remove('error'); }
  };
  const handle = selected => {
    const files = Array.from(selected || []).filter(f => f instanceof File);
    if (!files.length) return;
    const count = files.length;
    status(`${count} file${count === 1 ? '' : 's'} received. Preparing your workspace…`);
    if (state.callback) state.callback(files);
    else {
      state.pending.push(...files);
      const list = document.getElementById('file-list');
      if (list) {
        const text = document.createElement('p');
        text.className = 'upload-fallback';
        text.textContent = `${state.pending.length} file(s) chosen. If the list does not update, reload this page and check that JavaScript is enabled.`;
        list.replaceChildren(text);
      }
    }
  };
  document.addEventListener('change', event => {
    if (event.target?.id !== 'file-input') return;
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    handle(selected);
  }, true);
  document.addEventListener('dragenter', event => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    document.body.classList.add('file-drag-active');
  }, true);
  document.addEventListener('dragover', event => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    document.body.classList.add('file-drag-active');
  }, true);
  document.addEventListener('drop', event => {
    if (!isFileDrag(event) && !(event.dataTransfer?.files?.length)) return;
    event.preventDefault();
    event.stopPropagation(); // Never navigate to a dropped document.
    document.body.classList.remove('file-drag-active');
    handle(event.dataTransfer?.files);
  }, true);
  document.addEventListener('dragleave', event => {
    if (!event.relatedTarget || event.relatedTarget === document.documentElement) document.body.classList.remove('file-drag-active');
  }, true);
  document.addEventListener('click', event => {
    const zone = event.target.closest?.('#dropzone');
    if (!zone || event.target.closest('input, button, a, label')) return;
    const chooser = document.getElementById('file-input');
    chooser?.click();
  });
  window.SudypUpload = {
    onFiles(callback) {
      state.callback = callback;
      if (state.pending.length) {
        const pending = state.pending.splice(0);
        callback(pending);
      }
    },
    ready: true
  };
})();
