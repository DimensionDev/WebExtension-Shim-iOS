import XCTest
import UIKit
import WebKit
import HoloflowsKit
import ConsolePrint
import RealmSwift
import SwiftyJSON

class TabsTests: XCTestCase {

    var browser = Browser()
    
    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension TabsTests {

    func testEcho() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)

        let echoExpectation = expectation(description: "echo")
        let echoScript = """
        browser.echo(
            { "key": "Hello, World!" }
        );
        """
        tab.webView.evaluateJavaScript(echoScript) { (any, error) in
            consolePrint("\(String(describing: any)) \(error?.localizedDescription ?? "")")
            echoExpectation.fulfill()
        }
        wait(for: [echoExpectation], timeout: 3.0, enforceOrder: true)

        let waitEchoConsolePrintExpectation = expectation(description: "waitEchoConsolePrint")
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            waitEchoConsolePrintExpectation.fulfill()
        }
        wait(for: [waitEchoConsolePrintExpectation], timeout: 4)
        // ^ Tab.swift[87], userContentController(_:didReceive:): [echo]: {"messageID":"0.o1brjamoei","key":"Hello, World!"}
    }

}

extension TabsTests {

    func testScriptExecute() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)

        let addFunctionExpectation = expectation(description: "addFunction")
        let addFunctionScript = """
        function plus(lhs, rhs) {
            return lhs + rhs;
        };
        """
        tab.webView.evaluateJavaScript(addFunctionScript) { (any, error) in
            XCTAssertNil(error, error?.localizedDescription ?? "")
            addFunctionExpectation.fulfill()
        }
        wait(for: [addFunctionExpectation], timeout: 3.0, enforceOrder: true)

        let calculateExpectation = expectation(description: "calculate")
        let calculateScript = """
        browser.tabsExecuteScript({
            tabId: 0,
            details: {
                code: "var result = plus(50 * 8, 2);"
            }
        });
        """
        tab.webView.evaluateJavaScript(calculateScript) { (any, error) in
            consolePrint("\(String(describing: any)), \(error?.localizedDescription ?? "")")
            calculateExpectation.fulfill()
        }
        wait(for: [calculateExpectation], timeout: 3.0, enforceOrder: true)

        let resultCheckExpectation = expectation(description: "resultCheck")
        tab.webView.evaluateJavaScript("result;") { (any, error) in
            XCTAssertEqual(any as? Int, 402);
            resultCheckExpectation.fulfill()
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
    }

    func testSendReceive() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)

        let addReceiveListenerScript = """
        var result = '';
        document.addEventListener('receive', event => {
            result = event.detail.message;
            browser.echo({result});
        });
        """
        tab.webView.evaluateJavaScript(addReceiveListenerScript, completionHandler: nil)

        let sendExpectation = expectation(description: "send")
        let sendScript = """
        browser.send({ tabID: \(tab.id), message: { key:"value" } });
        """
        tab.webView.evaluateJavaScript(sendScript) { (any, error) in
            consolePrint("\(String(describing: any)) \(error?.localizedDescription ?? "")")
            sendExpectation.fulfill()
        }
        wait(for: [sendExpectation], timeout: 3.0)

        let callbackWaitExpectation = expectation(description: "callbackWait")
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            callbackWaitExpectation.fulfill()
        }
        wait(for: [callbackWaitExpectation], timeout: 4)

        let resultCheckExpectation = expectation(description: "resultCheck")
        tab.webView.evaluateJavaScript("result;") { (any, error) in
            XCTAssertNil(error, error?.localizedDescription ?? "")
            XCTAssertNotNil(any)
            XCTAssertEqual(JSON(rawValue: any!)!["key"], "value");
            resultCheckExpectation.fulfill()
        }
        wait(for: [resultCheckExpectation], timeout: 3.0, enforceOrder: true)
    }

}

extension TabsTests {

    func testStorageLocalSet() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)
        removeRealmDataStub()

        let setScript = """
        browser.storageLocalSet({
            keys: {
                kitten: { name:"Moggy", tentacles: false, eyeCount: 2 },
                monster: { name: "Kraken", tentacles: true, eyeCount: 10 }
            }
        });
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: setScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)

        let entriesRetrieved = getRealmDataStub()
        XCTAssertEqual(entriesRetrieved.count, 2)
    }

    func testStorageLocalGet() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)
        addRealmDataStub()

        // call get script
        let getScript = """
        browser.storageLocalGet({
            keys: [ 'kitten', 'monster' ]
        });
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: getScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)
        // document.dispatchEvent(new CustomEvent('0.1ls5p0e630o', {"detail":{"monster":"{ name: \"Kraken\", tentacles: true, eyeCount: 10 }","kitten":"{ name:\"Moggy\", tentacles: false, eyeCount: 2 }"}}))
    }

    func testStorageLocalRemove() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)
        addRealmDataStub()

        XCTAssertEqual(getRealmDataStub().count, 2)

        // call remove script
        let removeScript = """
        browser.storageLocalRemove({
            keys: 'kitten'
        });
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: removeScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)
        // dispatchEvent(webView:eventName:result:completionHandler:): document.dispatchEvent(new CustomEvent('0.byfgbqnopbq', {"detail":{"kitten":"{ name:\"Moggy\", tentacles: false, eyeCount: 2 }"}}))

        XCTAssertEqual(getRealmDataStub().count, 1)
    }

    func testStorageLocalClear() {
        let tab = browser.tabs.create(options: nil)
        prepareTest(tab: tab)
        addRealmDataStub()

        XCTAssertEqual(getRealmDataStub().count, 2)

        // call clear script
        let clearScript = """
        browser.storageLocalClear();
        """
        let scriptExpectation = expectEvaluateJavaScript(in: tab.webView, script: clearScript) { any, error in
            // do nothing
        }
        wait(for: [scriptExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        // file:///Users/MainasuK/Library/Developer/CoreSimulator/Devices/52666318-D601-4CFF-B697-4DCAF255E8CD/data/Documents/default.realm

        waitCallback(5)
        // document.dispatchEvent(new CustomEvent('0.pke999u8a2', {"detail":{"monster":"{ name: \"Kraken\", tentacles: true, eyeCount: 10 }","kitten":"{ name:\"Moggy\", tentacles: false, eyeCount: 2 }"}}))

        XCTAssertEqual(getRealmDataStub().count, 0)
    }

    private func removeRealmDataStub() {
        let realm = RealmService.default.realm
        // purge database
        let entriesToRemove = realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
        realm.beginWrite()
        realm.delete(entriesToRemove)
        try! realm.commitWrite()
    }

    private func addRealmDataStub() {
        let realm = RealmService.default.realm
        realm.beginWrite()
        let kitten: LocalStorage = {
            let entry = LocalStorage()
            entry.key = "kitten"
            entry.value = """
            { name:"Moggy", tentacles: false, eyeCount: 2 }
            """
            return entry
        }()
        let monster: LocalStorage = {
            let entry = LocalStorage()
            entry.key = "monster"
            entry.value = """
            { name: "Kraken", tentacles: true, eyeCount: 10 }
            """
            return entry
        }()

        realm.add([kitten, monster], update: .all)
        try! realm.commitWrite()
    }

    private func getRealmDataStub() -> [LocalStorage] {
        let realm = RealmService.default.realm
        return realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
    }

}

extension TabsTests {

    public func testRuntimeGetManifest() {
        let tab = browser.tabs.create(options: nil)
        let tabDelegate = TabDelegateStub()
        tab.delegate = tabDelegate
        prepareTest(tab: tab)

        let getManifestScript = """
        var manifest = "";
        browser.getManifest().then(val => {
            browser.echo({ manifest: val });
            manifest = val;
        });
        """
        let getManifestExpectation = expectEvaluateJavaScript(in: tab.webView, script: getManifestScript) { (any, error) in
            // do nothing
        }
        wait(for: [getManifestExpectation], timeout: 3.0)
        waitCallback(3)

        let checkManifestExpectation = expectEvaluateJavaScript(in: tab.webView, script: "manifest;") { (any, error) in
            XCTAssertNil(error)
            XCTAssertNotNil(any)
            let manifest = JSON(rawValue: any!)
            XCTAssertEqual(manifest, JSON(rawValue: TabsTests.manifest))
            XCTAssertEqual(manifest!["content_scripts"].arrayValue.first?["all_frames"].bool, true)
        }
        wait(for: [checkManifestExpectation], timeout: 3.0)
    }

    private class TabDelegateStub: TabDelegate {
        func tab(_ tab: Tab, requestManifest: Void) -> String {
            return String(data: TabsTests.manifest, encoding: .utf8)!
        }

        func tab(_ tab: Tab, requestBundleResourceManager: Void) -> BundleResourceManager? {
            return CustomURLSchemeHandler()
        }

        func tab(_ tab: Tab, requestBlobResourceManager: Void) -> BlobResourceManager? {
            return nil
        }

        func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtensionAPI.DownloadOptions) {
            // do nothing
        }

        func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtensionAPI.DownloadOptions, result: Result<BlobStorage, Error>) {
            // do nothing
        }
    }

    private static var manifest = """
    {
        "$schema": "http://json.schemastore.org/chrome-manifest",
        "name": "Maskbook",
        "version": "1.3.2",
        "manifest_version": 2,
        "content_scripts": [
            {
                "matches": ["https://www.facebook.com/*"],
                "js": ["polyfill/adoptedStyleSheets.js", "polyfill/browser-polyfill.min.js", "js/contentscript.js"],
                "run_at": "document_idle",
                "all_frames": true
            }
        ],
        "web_accessible_resources": ["*.css", "*.js", "*.jpg", "*.png"],
        "permissions": ["https://www.facebook.com/*", "storage", "downloads", "background", "webNavigation"],
        "background": {
            "scripts": ["polyfill/webcrypto-liner.shim.js", "polyfill/browser-polyfill.min.js", "js/backgroundservice.js"]
        },
        "options_ui": {
            "page": "index.html",
            "open_in_tab": true
        },
        "icons": {
            "16": "16x16.png",
            "48": "48x48.png",
            "128": "128x128.png",
            "256": "256x256.png"
        },
        "homepage_url": "https://maskbook.io",
        "description": "__MSG_manifest_description__",
        "default_locale": "en"
    }
    """.data(using: .utf8)!

}

extension TabsTests {

    func testBundle() {
        consolePrint(Bundle(for: Tab.self))
        consolePrint(Bundle.main)
        consolePrint(Bundle(for: TabsTests.self))
    }

    func testBundleGetResource() {
        let bundle = Bundle(for: TabsTests.self)
        let path = bundle.path(forResource: "lena_std.tif", ofType: "tiff")
        XCTAssertNotNil(path)

        let dataTaskExpectation = expectation(description: "dataTask")
        URLSession.shared.dataTask(with: URL(fileURLWithPath: path!)) { (data, response, error) in
            XCTAssertNotNil(data)
            XCTAssertEqual(data!.count, 786628)

            XCTAssertNotNil(response)
            XCTAssertEqual(response?.mimeType!, "image/tiff")
            XCTAssertEqual(response?.suggestedFilename, "lena_std.tif.tiff")

            dataTaskExpectation.fulfill()
        }.resume()

        wait(for: [dataTaskExpectation], timeout: 3.0)
    }

    func testURLSchemeHandlerTask() {
        let handler = CustomURLSchemeHandler()
        browser.bundleResourceManager = handler
        handler.handlerExpectation = expectation(description: "handler")

        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(handler, forURLScheme: "holoflows-extension")

        let tab = browser.tabs.create(options: nil, webViewConfiguration: configuration)
        prepareCustomURLSchemeTest(tab: tab)

        wait(for: [handler.handlerExpectation!], timeout: 3.0)
    }

    func testRuntimeGetURL() {
        let hander = CustomURLSchemeHandler()
        hander.handlerExpectation = expectation(description: "hander")
        browser.bundleResourceManager = hander

        let tab = browser.tabs.create(options: nil)
        prepareCustomURLSchemeTest(tab: tab)

        wait(for: [hander.handlerExpectation!], timeout: 10.0)
    }

    func testRuntimeGetURL_BundleResourceManager() {
        let hander = BundleResourceManager(bundle: Bundle(for: TabsTests.self))
        browser.bundleResourceManager = hander

        let tab = browser.tabs.create(options: nil)
        prepareCustomURLSchemeTest(tab: tab)

        waitCallback(3)

        let checkSizeScript = """
            var img = document.getElementById('lena');
            var width = img.clientWidth;
            width;
        """
        let checkSizeExpectation = expectEvaluateJavaScript(in: tab.webView, script: checkSizeScript) { (any, error) in
            XCTAssertNotNil(any)
            XCTAssertEqual(any as? Int, 512)
        }

        wait(for: [checkSizeExpectation], timeout: 3.0)
    }

    private class CustomURLSchemeHandler: BundleResourceManager {

        var handlerExpectation: XCTestExpectation?

        init() {
            super.init(bundle: Bundle())
        }

        override init(bundle: Bundle) {
            super.init(bundle: bundle)
        }

        override func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
            consolePrint(urlSchemeTask.request)

            XCTAssertEqual(URL(string: "holoflows-extension://images/lena_std.tif.tiff"), urlSchemeTask.request.url)
            let fileExtension = urlSchemeTask.request.url?.pathExtension
            let filename = urlSchemeTask.request.url?.deletingPathExtension().lastPathComponent
            XCTAssertEqual(fileExtension, "tiff")
            XCTAssertEqual(filename, "lena_std.tif")

            handlerExpectation?.fulfill()
        }

        override func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
            // do nothing
        }
    }

}

extension TabsTests {

    func testCreateObjectURL() {
        let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: TabsTests.self))
        let blobResourceManager = BlobResourceManager()
        browser.bundleResourceManager = bundleResourceManager
        browser.blobResourceManager = blobResourceManager

        let tab = browser.tabs.create(options: nil)
        prepareBlobTest(tab: tab)

        let image = UIImage(named: "lena_std.tif.tiff", in: Bundle(for: TabsTests.self), compatibleWith: nil)!
        let base64EncodedString = image.pngData()!.base64EncodedString()

        let addLenaBase64Script = """
        var lena = document.createElement('img');
        lena.id = 'base64Image'
        lena.src = 'data:image/png;base64,\(base64EncodedString)'

        var width = 0;
        lena.onload = function() {
            browser.echo({ echo: this.clientWidth });
            width = this.clientWidth;
        };
        document.body.appendChild(lena);
        """
        let addLenaBase64Expectation = expectEvaluateJavaScript(in: tab.webView, script: addLenaBase64Script) { (any, error) in
            // do nothing
        }
        wait(for: [addLenaBase64Expectation], timeout: 3.0)
        waitCallback(3)

        // check lena
        let checkSizeScript = """
            width;
        """
        let checkSizeExpectation = expectEvaluateJavaScript(in: tab.webView, script: checkSizeScript) { (any, error) in
            XCTAssertNotNil(any)
            XCTAssertEqual(any as? Int, 512)
        }
        wait(for: [checkSizeExpectation], timeout: 3.0)

        let createObjectURLScript = """
        width = 0;
        browser.createObjectURL({
            prefix: 'test',
            blob: '\(base64EncodedString)',
            type: 'image/png'
        }).then(url => {
            var blobImage = document.createElement('img');
            blobImage.onload = function() {
                width = this.clientWidth;
            };
            blobImage.id = 'blobImage';
            blobImage.src = url + '.png';
            document.body.appendChild(blobImage);
        });
        """
        let createObjectURLExpectation = expectEvaluateJavaScript(in: tab.webView, script: createObjectURLScript) { (any, error) in
            // do nothing
        }
        wait(for: [createObjectURLExpectation], timeout: 3.0)
        waitCallback(3)

        // check blob
        let checkSizeScript2 = """
            width;
        """
        let checkSizeExpectation2 = expectEvaluateJavaScript(in: tab.webView, script: checkSizeScript2) { (any, error) in
            XCTAssertNotNil(any)
            XCTAssertEqual(any as? Int, 512)
        }
        wait(for: [checkSizeExpectation2], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL!)
    }

    private func removeRealmStub(uuid: String) {
        let realm = RealmService.default.realm
        if let blobStorage = realm.object(ofType: BlobStorage.self, forPrimaryKey: uuid) {
            try! realm.write {
                realm.delete(blobStorage)
            }
        }
    }

}

extension TabsTests {

    func testDownloadsDownload() {
        let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: TabsTests.self))
        let blobResourceManager = BlobResourceManager()
        browser.bundleResourceManager = bundleResourceManager
        browser.blobResourceManager = blobResourceManager

        let tab = browser.tabs.create(options: nil)
        prepareDownloadTest(tab: tab)

        let image = UIImage(named: "lena_std.tif.tiff", in: Bundle(for: TabsTests.self), compatibleWith: nil)!
        let base64EncodedString = image.pngData()!.base64EncodedString()

        let downloadScript = """
        browser.createObjectURL({
            prefix: 'download',
            blob: '\(base64EncodedString)',
            type: 'image/png'
        }).then(url => {
            browser.download({
                options: {
                    filename: 'lena.png',
                    url: url
                }
            });
        });
        """
        let downloadExpectation = expectEvaluateJavaScript(in: tab.webView, script: downloadScript) { (any, error) in
            // do nothing
        }
        wait(for: [downloadExpectation], timeout: 3.0)
    }
}

// MARK: - Helper
extension TabsTests {

    private func prepareTest(tab: Tab) {
        if tab.webView.url == nil {
            tab.webView.loadHTMLString("", baseURL: nil)
        }

        // wait for browser script inject
        let sleepExpectation = expectation(description: "sleep")
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            sleepExpectation.fulfill()
        }
        wait(for: [sleepExpectation], timeout: 6.0)
    }

    private func prepareCustomURLSchemeTest(tab: Tab) {
        let bundle = Bundle(for: TabsTests.self)
        let htmlPath = bundle.path(forResource: "Lena", ofType: "html")
        XCTAssertNotNil(htmlPath)
        let url = URL(fileURLWithPath: htmlPath!)
        let html = try? String(contentsOf: url)
        XCTAssertNotNil(html)
        tab.webView.loadHTMLString(html!, baseURL: bundle.bundleURL)

        waitCallback(3)
    }

    private func prepareBlobTest(tab: Tab) {
        prepareCustomURLSchemeTest(tab: tab)
    }

    private func prepareDownloadTest(tab: Tab) {
        prepareCustomURLSchemeTest(tab: tab)
    }

    private func expectEvaluateJavaScript(in webView: WKWebView, script: String, verbose: Bool = true, completionHandler: @escaping ((Any?, Error?) -> Void)) -> XCTestExpectation {
        let scriptExpectation = expectation(description: "evaluate java script")

        webView.evaluateJavaScript(script) { (any, error) in
            consolePrint("\(String(describing: any)) \(error?.localizedDescription ?? "")")
            completionHandler(any, error)
            scriptExpectation.fulfill()
        }

        return scriptExpectation
    }

    private func waitCallback(_ timeout: TimeInterval) {
        let waitCallbackExpectation = expectation(description: "waitCallback")

        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
            waitCallbackExpectation.fulfill()
        }

        wait(for: [waitCallbackExpectation], timeout: timeout * 2)
    }

}
