((browser) => {
  
  const Handels = {
    file: [],
    directory: [],
  }

  const getDirectoryEntriesRecursive = async (
    directoryHandle, relativePath = '.',
  ) => {
    const entries = {}; 
    
    for await (const handle of directoryHandle.values()) {
      const nestedPath = `${relativePath}/${handle.name}`;
      Handels[handle.kind].push({ handle, nestedPath });
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        entries[handle.name] = {
              name: handle.name,
              kind: handle.kind,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              relativePath: nestedPath,
        }
      } else if (handle.kind === 'directory') { 
        entries[handle.name]  = {
              name: handle.name,
              kind: handle.kind,
              relativePath: nestedPath,
              entries: await getDirectoryEntriesRecursive(handle, nestedPath),
        };
      }
    }
  
    return entries;
  };

  const getFileHandle = (path) =>
    Handles.file.find((element) => 
    element.nestedPath === path);

  const getDirectoryHandle = (path) => 
    Handles.directory.find((element) => 
    element.nestedPath === path);
 
  new ReadableStream({ start: (c) => 
  browser.runtime.onMessage.addListener(
  (...args) => c.enqueue(args) || true) }).pipeTo(
    new WritableStream({ async write(messages){
      const [request, sender, sendResponse] = message;
      const methods = {
        async getDirectoryStructure() {
          const root = await navigator.storage.getDirectory();
          const structure = await getDirectoryEntriesRecursive(root);
          const rootStructure = {
            '.': {
              kind: 'directory',
              relativePath: '.',
              entries: structure,
            },
          };
          sendResponse({ structure: rootStructure });
        },
        async saveFile() {
          const fileHandle = getFileHandle(request.data).handle;
          try {
            const handle = await showSaveFilePicker({
              suggestedName: fileHandle.name,
            });
            const writable = await handle.createWritable();
            await writable.write(await fileHandle.getFile());
            await writable.close();
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error(error.name, error.message);
            }
          }
        },
        async deleteFile() {
          const fileHandle = getFileHandle(request.data).handle;
          try {
            await fileHandle.remove();
            sendResponse({ result: 'ok' });
          } catch (error) {
            console.error(error.name, error.message);
            sendResponse({ error: error.message });
          }
        },
        async deleteDirectory() {
          const directoryHandle = getDirectoryHandle(request.data).handle;
          try {
            await directoryHandle.remove({ recursive: true });
            sendResponse({ result: 'ok' });
          } catch (error) {
            console.error(error.name, error.message);
            sendResponse({ error: error.message });
          }
        },
      }
      await methods[request.message]();
    }})
  );

})(chrome || browser);
