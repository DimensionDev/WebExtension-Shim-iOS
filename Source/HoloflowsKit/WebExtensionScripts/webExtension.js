{
   function generateID() {
      return Math.random().toString(36)
   }
   function post(/** @type{string} */ methodName, obj) {
      return new Promise((resolve, reject) => {
         try {
            const messageID = generateID()
            document.addEventListener(
               messageID,
               (/** @type{CustomEvent} */ event) => {
                  const result = event.detail
                  resolve(result)
               },
               { once: true }
            )
            // if iOS
            window.webkit.messageHandlers[methodName].postMessage(JSON.stringify({ messageID, ...obj }))
         } catch (e) {
            reject(e)
         }
      })
   }

   window.browser = {
      echo: obj => post('echo', obj),
      send: obj => post('send', obj),
      createObjectURL: obj => post('createObjectURL', obj),
      tabsCreate: obj => post('browserTabsCreate', obj),
      tabsRemove: obj => post('browserTabsRemove', obj),
      tabsExecuteScript: obj => post('browserTabsExecuteScript', obj),
      storageLocalGet: obj => post('browserStorageLocalGet', obj),
      storageLocalSet: obj => post('browserStorageLocalSet', obj),
      storageLocalRemove: obj => post('browserStorageLocalRemove', obj),
      storageLocalClear: obj => post('browserStorageLocalClear', obj),
      getManifest: obj => post('browserRuntimeGetManifest', obj),
      getURL: obj => post('browserRuntimeGetURL', obj),
      download: obj => post('browserDownloadsDownload', obj)
   }
}

//browser.echo({ payload: "Payload" }).then(val => {
//   console.log(JSON.stringify(val))
//})

//browser.tabsCreate({ createProperties: { url: "https://www.apple.com" } }).then(val =>  {
//   console.log(JSON.stringify(val))   
//})

//browser.tabsExecuteScript({ tabId: 0, details: { code: "console.log('location', window.location.href)" } }).then(val =>  {
//   console.log(JSON.stringify(val))   
//})
