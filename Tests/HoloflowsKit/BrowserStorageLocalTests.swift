//
//  BrowserStorageLocalTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import WebKit
import WebExtension_Shim
import SwiftyJSON
import ConsolePrint

class BrowserStorageLocalTests: XCTestCase {

    lazy var browser = Browser(delegate: self)
    let blobResourceManager = BlobResourceManager(realm: RealmService.default.realm)

    override func setUp() {
        super.setUp()
        browser = Browser(delegate: self)
    }

}

extension BrowserStorageLocalTests: BrowserDelegate {
    
    func pluginResourceURLScheme() -> [String] {
        return []
    }
    
    func browser(_ browser: Browser, pluginForScriptType scriptType: Plugin.ScriptType) -> Plugin {
        return Plugin(id: UUID().uuidString, manifest: JSON.null, environment: scriptType, resources: JSON.null)
    }
    
    func browser(_ browser: Browser, webViewConfigurationForOptions options: WebExtension.Browser.Tabs.Create.Options?) -> WKWebViewConfiguration {
        return WKWebViewConfiguration()
    }
    
    func browser(_ browser: Browser, tabDelegateForTab tab: Tab) -> TabDelegate? {
        return self
    }
    
    func browser(_ browser: Browser, tabDownloadDelegateFor tab: Tab) -> TabDownloadsDelegate? {
        return nil
    }
    
}

extension BrowserStorageLocalTests: TabDelegate {
    
    func uiDelegateShim(for tab: Tab) -> WKUIDelegateShim? {
        return nil
    }
    
    func navigationDelegateShim(for tab: Tab) -> WKNavigationDelegateShim? {
        return nil
    }
    
    func tab(_ tab: Tab, localStorageManagerForExtension id: String) -> LocalStorageManager? {
        guard let realm = RealmService(name: id).realm else { return nil }
        return LocalStorageManager(realm: realm)
    }
    
    func tab(_ tab: Tab, pluginResourceProviderForURL url: URL) -> PluginResourceProvider? {
        switch url.scheme {
        case "holoflows-blob":
            return blobResourceManager
        default:
            return nil
        }
    }
    
}

extension BrowserStorageLocalTests {

    func testGet() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let id = UUID().uuidString
        addRealmDataStub(for: id)

        let get = WebExtension.Browser.Storage.Local.Get(extensionID: id, keys: ["kitten", "monster"])
        let request = HoloflowsRPC.Request(params: get, id: id)
        let getScript = TestHelper.webKit(messageBody: request)
        let getExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: getScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [getExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
    }

    func testGet_kitten() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let id = UUID().uuidString
        addRealmDataStub(for: id)

        let get = WebExtension.Browser.Storage.Local.Get(extensionID: id, keys: ["kitten"])
        let request = HoloflowsRPC.Request(params: get, id: id)
        let getScript = TestHelper.webKit(messageBody: request)
        let getExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: getScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [getExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
    }

    func testSet() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let id = UUID().uuidString
        removeRealmDataStub(for: id)
        XCTAssertEqual(getRealmDataStub(for: id).count, 0)

        let object = """
        {
            "kitten": { "name":"Moggy", "tentacles": false, "eyeCount": 2 },
            "monster": { "name": "Kraken", "tentacles": true, "eyeCount": 10 }
        }
        """
        let objectJSON = JSON(parseJSON: object)
        let set = WebExtension.Browser.Storage.Local.Set(extensionID: id, object: objectJSON)
        let setScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: set, id: id))
        let setExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: setScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [setExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        TestHelper.waitCallback(3.0, forTestCase: self)

        XCTAssertEqual(getRealmDataStub(for: id).count, 2)
    }

    func testSet_monster() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let id = UUID().uuidString
        removeRealmDataStub(for: id)
        XCTAssertEqual(getRealmDataStub(for: id).count, 0)

        let object = """
        {
            "monster": { "name": "Kraken", "tentacles": true, "eyeCount": 10 }
        }
        """
        let objectJSON = JSON(parseJSON: object)
        let set = WebExtension.Browser.Storage.Local.Set(extensionID: id, object: objectJSON)
        let setScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: set, id: id))
        let setExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: setScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [setExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        TestHelper.waitCallback(3.0, forTestCase: self)

        XCTAssertEqual(getRealmDataStub(for: id).count, 1)
    }

    func testRemove() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let id = UUID().uuidString
        addRealmDataStub(for: id)
        XCTAssertEqual(getRealmDataStub(for: id).count, 2)

        let remove = WebExtension.Browser.Storage.Local.Remove(extensionID: id, keys: ["kitten", "monster"])
        let removeScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: remove, id: id))
        let removeExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: removeScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [removeExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        TestHelper.waitCallback(3.0, forTestCase: self)

        XCTAssertEqual(getRealmDataStub(for: id).count, 0)
    }

    func testClear() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)

        let id = UUID().uuidString
        addRealmDataStub(for: id)
        XCTAssertEqual(getRealmDataStub(for: id).count, 2)

        let clear = WebExtension.Browser.Storage.Local.Clear(extensionID: id)
        let clearScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: clear, id: id))
        let clearExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: clearScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [clearExpectation], timeout: 3.0)

        XCTAssertEqual(getRealmDataStub(for: id).count, 0)
    }

}


extension BrowserStorageLocalTests {

    fileprivate func removeRealmDataStub(for id: String) {
        let realm = RealmService(name: id).realm
        // purge database
        let entriesToRemove = realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
        realm.beginWrite()
        realm.delete(entriesToRemove)
        try! realm.commitWrite()
    }

    fileprivate func addRealmDataStub(for id: String) {
        let realm = RealmService(name: id).realm
        realm.beginWrite()
        let kitten: LocalStorage = {
            let entry = LocalStorage()
            entry.key = "kitten"
            
            var json = JSON()
            json["name"] = "Moggy"
            json["tentacles"] = false
            json["eyeCount"] = 2
            entry.value = (try? JSONEncoder().encode(json)) ?? Data()
            return entry
        }()
        let monster: LocalStorage = {
            let entry = LocalStorage()
            entry.key = "monster"
            
            var json = JSON()
            json["name"] = "Kraken"
            json["tentacles"] = true
            json["eyeCount"] = 10
            entry.value = (try? JSONEncoder().encode(json)) ?? Data()
            return entry
        }()

        realm.add([kitten, monster], update: .all)
        try! realm.commitWrite()
    }

    fileprivate func getRealmDataStub(for id: String) -> [LocalStorage] {
        let realm = RealmService(name: id).realm
        return realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
    }

}
