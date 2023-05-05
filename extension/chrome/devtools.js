/** Simple bridge via devtools from tab to background.js */
((browser) => {
  let confirmDialog = null;
  let errorDialog = null;
  const extPanel = {};
  let main = null;
  let mainInnerHTML = '';
  
  
  const mainEmptyHTML = '<span>🫙</span> Origin Private File System is empty.';
  
  let interval = null;

  let lastLength = 0;

  const readableSize = (size) => {
    if (size === 0) return '0B';
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${
      ['B', 'KB', 'MB', 'GB', 'TB'][i]
    }`;
  };

  /** listen for deleteSpan clicks 
  
          deleteSpan.addEventListener('click', (event) => {
            confirmDialog.querySelector('span').textContent = 'directory';
            confirmDialog.querySelector('code').textContent = key;
            confirmDialog.addEventListener(
              'close', (event) => {
                confirmDialog.returnValue === 'delete' &&
                  browser.tabs.sendMessage(
                    browser.devtools.inspectedWindow.tabId,
                    { message: 'deleteDirectory', data: value.relativePath, }, 
                    ({ error }) => error 
                    ? (errorDialog.querySelector('p').textContent = error) && errorDialog.showModal() 
                    : div.remove(),
                  );
              },
              { once: true },
            );
            confirmDialog.showModal();
          });

  
  
  */
  
  const createTreeHTML = (structure, div, doc) => {
    const entries = Object.entries(structure);
    // Sort entries by name and kind.
    entries
      .sort((a, b) => {
        if (a[0] === b[0]) return 0;
        return a[0] < b[0] ? -1 : 1;
      })
      .sort((a, b) => {
        if (a[1].kind === b[1].kind) return 0;
        return a[1].kind < b[1].kind ? -1 : 1;
      });
    for (const [key, value] of entries) {
      if (value.kind === 'directory') {
        doc.write(`<details ${value.relativePath === '.' ? 'open="true" class="root"' : ''}`><summary class="directory">${value.relativePath === '.' ? ' ' : '<span class="directory-name">${key}</span><span class="delete">🗑️</span></div><div>'}`)
        
        createTreeHTML(value.entries, div, doc);
      } else if (value.kind === 'file') {
        
         doc.write(
        `<div class="file" data-key="${key}" data-relativ-path="${value.relativPath}" data-type="${value.type}" tab-index="0" title="${`Type: ${
          value.type || 'Unknown'
        } - Last modified: ${new Date(value.lastModified).toLocaleString()}`}"><span class="file">${key}</span><span class="size">${readableSize(value.size)}</span><span class="delete">🗑️</span>  `;
        
      
        fileNameSpan.addEventListener('click', (event) => {
          browser.tabs.sendMessage(browser.devtools.inspectedWindow.tabId, {
            message: 'saveFile',
            data: value.relativePath,
          });
        });
        
        deleteSpan.addEventListener('click', (event) => {
          confirmDialog.querySelector('span').textContent = 'file';
          confirmDialog.querySelector('code').textContent = event.target.parent.querySelector('span.file').textContent;
          confirmDialog.addEventListener('close',(event) => {
              if (confirmDialog.returnValue === 'delete') {
                browser.tabs.sendMessage(
                  browser.devtools.inspectedWindow.tabId,
                  { message: 'deleteFile', data: value.relativePath, },
                  (response) => {
                    if (response.error) {
                      errorDialog.querySelector('p').textContent =
                        response.error;
                      return errorDialog.showModal();
                    }
                    div.remove();
                  },
                );
              }
            },
            { once: true },
          );
          confirmDialog.showModal();
        });
        
        
      }
    }
  };

  const refreshTree = () => {
    confirmDialog = extPanel.window.document.body.querySelector('.confirm-dialog');
    errorDialog = extPanel.window.document.body.querySelector('.error-dialog');
    main = extPanel.window.document.body.querySelector('main');
    
    if (!mainInnerHTML) {
      mainInnerHTML = main.innerHTML;
    }

    lastLength = 0;

    browser.tabs.sendMessage(
      browser.devtools.inspectedWindow.tabId,
      { message: 'getDirectoryStructure' },
      (response) => {
        if (!response.structure) {
          return;
        }
        // Naive check to avoid unnecessary DOM updates.
        const newLength = JSON.stringify(response.structure).length;
        if (lastLength === newLength) {
          return;
        }
        lastLength = newLength;
        if (Object.keys(response.structure).length === 0) {
          main.innerHTML = mainEmptyHTML;
          return;
        }
        const opfsDoc = createHTMLDocument('OPFS is fast so I AM');
        opfsDoc.write('<div>')
        const div = opfsDoc.body.firstChild;
        createTreeHTML(response.structure, div, opfsDoc);
        main.innerHTML = '';
        main.append(div);
        main.addEventListener('keydown', (event) => {
          if (event.target.nodeName === 'SUMMARY') {
            if (event.key === 'ArrowRight') {
              event.target.parentElement.open = true;
            } else if (event.key === 'ArrowLeft') {
              event.target.parentElement.open = false;
            }
          }
        });
      },
    );
  };

  browser.devtools.panels.create(
    'OPFS Explorer',
    'icon128.png',
    'panel.html',
    (panel) => {
      panel.onShown.addListener((extPanelWindow) => {
        extPanel.window = extPanelWindow;
        refreshTree();
        interval = setInterval(refreshTree, 3000);
      });

      panel.onHidden.addListener(() => {
        clearInterval(interval);
      });
    },
  );

  // Create a connection to the background service worker.
  const backgroundPageConnection = browser.runtime.connect({
    name: 'devtools-page',
  });

  // Relay the tab ID to the background service worker.
  backgroundPageConnection.postMessage({
    name: 'init',
    tabId: browser.devtools.inspectedWindow.tabId,
  });

  backgroundPageConnection.onMessage.addListener((message) => {
    if (message.name === 'navigation') {
      lastLength = 0;
      main.innerHTML = mainInnerHTML;
      refreshTree();
    }
  });
})(chrome || browser);
