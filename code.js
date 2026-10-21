// Comment Mirror - main thread.
//
// The Plugin API cannot read or write comments, so every REST call happens in
// ui.html. This file only does what the UI iframe cannot:
//   1. store/read the token in figma.clientStorage
//   2. tell the UI which file we are running in (figma.fileKey)
//   3. check whether node ids from the source comments exist in this file
//
// Requests from the UI carry a reqId; we answer with { type:'reply', reqId }.

figma.showUI(__html__, { width: 460, height: 700, title: 'Comment Mirror', themeColors: true });

const TOKEN_KEY = 'commentMirror.token';

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      // UI finished loading: send the stored token and this file's key.
      case 'init': {
        const token = await figma.clientStorage.getAsync(TOKEN_KEY);
        figma.ui.postMessage({
          type: 'init',
          token: token || '',
          fileKey: figma.fileKey || null, // undefined when the key is not available
        });
        break;
      }

      case 'save-token':
        await figma.clientStorage.setAsync(TOKEN_KEY, msg.token);
        break;

      case 'forget-token':
        await figma.clientStorage.deleteAsync(TOKEN_KEY);
        break;

      // Which of these node ids exist in the current file?
      // getNodeByIdAsync loads the needed page itself (dynamic-page access).
      case 'check-nodes': {
        const existing = [];
        for (const id of msg.ids) {
          try {
            if (await figma.getNodeByIdAsync(id)) existing.push(id);
          } catch (e) {
            // malformed id -> treat as missing
          }
        }
        figma.ui.postMessage({ type: 'reply', reqId: msg.reqId, existing });
        break;
      }
    }
  } catch (err) {
    // Always answer, otherwise the UI would wait forever on this request.
    figma.ui.postMessage({ type: 'reply', reqId: msg.reqId, error: String((err && err.message) || err) });
  }
};
