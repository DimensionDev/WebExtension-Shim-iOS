//
//  BrowserDownloadsTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import HoloflowsKit
import ConsolePrint

class BrowserDownloadsTests: XCTestCase {

    var browser = Browser()

    override func setUp() {
        super.setUp()
        browser = Browser()
    }

}

extension BrowserDownloadsTests {

    func testDownload() {
        let stubTabDelegate = StubTabDelegate()
        stubTabDelegate.downloadExpectation = expectation(description: "download check")

        let bundleResourceManager = BundleResourceManager(bundle: Bundle(for: BrowserDownloadsTests.self))
        let blobResourceManager = BlobResourceManager()
        stubTabDelegate.bundleResourceManager = bundleResourceManager
        stubTabDelegate.blobResourceManager = blobResourceManager

        let tab = browser.tabs.create(options: nil)
        tab.delegate = stubTabDelegate
        TestHelper.prepareTest(tab: tab, forTestCase: self)


        // add create object URL listener
        let createObjectURLID = UUID().uuidString
        let addListenerScript = """
        var url = '';
        document.addEventListener('\(ScriptEvent.holoflowsjsonrpc.rawValue)', event => {
            if (event.detail.id != '\(createObjectURLID)') { return; }

            url = event.detail.result;
        });
        """
        let addListenerExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: addListenerScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [addListenerExpectation], timeout: 3.0)

        // creat blob url
        let image = UIImage(named: "lena_std.tif.tiff", in: Bundle(for: BrowserDownloadsTests.self), compatibleWith: nil)!
        let base64EncodedString = image.pngData()!.base64EncodedString()
        let createObjectURL = WebExtension.URL.CreateObjectURL(extensionID: "HoloflowsKit-UnitTests", blob: base64EncodedString, type: "image/png")
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
        wait(for: [stubTabDelegate.downloadExpectation!], timeout: 3.0)
    }

    private class StubTabDelegate: TabDelegate {

        weak var downloadExpectation: XCTestExpectation?
        var bundleResourceManager: BundleResourceManager?
        var blobResourceManager: BlobResourceManager?

        func tab(_ tab: Tab, requestManifestForExtension extensionID: String) -> String {
            return ""
        }

        func tab(_ tab: Tab, requestBundleResourceManagerForExtension extensionID: String) -> BundleResourceManager? {
            return bundleResourceManager
        }

        func tab(_ tab: Tab, requestBlobResourceManagerForExtension extensionID: String) -> BlobResourceManager? {
            return blobResourceManager
        }

        func tab(_ tab: Tab, willDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options) {
            // do nothing
        }

        func tab(_ tab: Tab, didDownloadBlobWithOptions options: WebExtension.Browser.Downloads.Download.Options, result: Result<BlobStorage, Error>) {
            switch result {
            case let .success(blobStorage):
                downloadExpectation?.fulfill()
                consolePrint(blobStorage)
            case .failure:
                XCTFail()
            }
        }
    }

}
