//
//  BrowserDownloadsTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import SwiftyJSON
import WebExtension_Shim
import ConsolePrint

class BrowserDownloadsTests: XCTestCase {

    lazy var browser = Browser(core: self)
    let localStorageManager = LocalStorageManager(realm: RealmService.default.realm)
    let blobResourceManager = BlobResourceManager(realm: RealmService.default.realm)
    let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: BrowserDownloadsTests.self))

    override func setUp() {
        super.setUp()
        browser = Browser(core: self)
    }

}

extension BrowserDownloadsTests: BrowserCore {

    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON.null, environment: type, resources: JSON.null)
    }


    func tab(_ tab: Tab, localStorageManagerForTab: Tab) -> LocalStorageManager {
        return localStorageManager
    }

    func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider? {
        switch url.scheme {
        case "holoflows-blob":
            return blobResourceManager
        case "holoflows-extension":
            return bundleResourceManager
        default:
            return nil
        }
    }

}

extension BrowserDownloadsTests {

    func testDownload() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        // add create object URL listener
        let createObjectURLID = UUID().uuidString
        let blobID = UUID().uuidString
        let addListenerScript = """
        var url = '';
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(createObjectURLID)') { return; }

            url = 'holoflows-blob://HoloflowsKit-UnitTests/\(blobID)'
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        // creat blob url
        let image = UIImage(named: "lena_std.tif.tiff", in: Bundle(for: BrowserDownloadsTests.self), compatibleWith: nil)!
        let base64EncodedString = image.pngData()!.base64EncodedString()
        let data = WebExtension.StringOrBlob(type: .blob, content: base64EncodedString, mimeType: "image/png")
        let createObjectURL = WebExtension.URL.CreateObjectURL(extensionID: "HoloflowsKit-UnitTests", uuid: blobID, data: data)
        let createObjectURLScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: createObjectURL, id: createObjectURLID))
        let createObjectURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: createObjectURLScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [createObjectURLExpectation], timeout: 3.0)

        // get url
        var url = ""
        let checkURLExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: "url;", forTestCase: self) { (any, error) in
            url = any as? String ?? ""
            XCTAssertEqual(url.isEmpty, false)
        }
        wait(for: [checkURLExpectation], timeout: 3.0)

        // download
        let download = WebExtension.Browser.Downloads.Download(extensionID: "HoloflowsKit-UnitTests", options: .init(filename: "lena_std.tif.tiff", url: url))
        let downloadScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: download, id: createObjectURLID))
        let downloadExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: downloadScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [downloadExpectation], timeout: 3.0)
    }

}
