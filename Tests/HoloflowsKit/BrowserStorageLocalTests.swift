//
//  BrowserStorageLocalTests.swift
//  HoloflowsKit-Unit-Tests
//
//  Created by Cirno MainasuK on 2019-6-24.
//

import XCTest
import WebExtension_Shim
import SwiftyJSON
import ConsolePrint

class BrowserStorageLocalTests: XCTestCase {

    lazy var browser = Browser(core: self)
    let localStorageManager = LocalStorageManager(realm: RealmService.default.realm)
    let blobResourceManager = BlobResourceManager(realm: RealmService.default.realm)

    override func setUp() {
        super.setUp()
        browser = Browser(core: self)
    }

}

extension BrowserStorageLocalTests: BrowserCore {

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
        default:
            return nil
        }
    }

}

extension BrowserStorageLocalTests {

    func testGet() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        addRealmDataStub()

        let get = WebExtension.Browser.Storage.Local.Get(extensionID: "HoloflowsKit-UnitTests", keys: ["kitten", "monster"])
        let request = HoloflowsRPC.Request(params: get, id: UUID().uuidString)
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
        addRealmDataStub()

        let get = WebExtension.Browser.Storage.Local.Get(extensionID: "HoloflowsKit-UnitTests", keys: ["kitten"])
        let request = HoloflowsRPC.Request(params: get, id: UUID().uuidString)
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
        removeRealmDataStub()
        XCTAssertEqual(getRealmDataStub().count, 0)

        let object = """
        {
            "kitten": { "name":"Moggy", "tentacles": false, "eyeCount": 2 },
            "monster": { "name": "Kraken", "tentacles": true, "eyeCount": 10 }
        }
        """
        let objectJSON = JSON(parseJSON: object)
        let set = WebExtension.Browser.Storage.Local.Set(extensionID: "HoloflowsKit-UnitTests", object: objectJSON)
        let setScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: set, id: UUID().uuidString))
        let setExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: setScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [setExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        TestHelper.waitCallback(3.0, forTestCase: self)

        XCTAssertEqual(getRealmDataStub().count, 2)
    }

    func testSet_monster() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        removeRealmDataStub()
        XCTAssertEqual(getRealmDataStub().count, 0)

        let object = """
        {
            "monster": { "name": "Kraken", "tentacles": true, "eyeCount": 10 }
        }
        """
        let objectJSON = JSON(parseJSON: object)
        let set = WebExtension.Browser.Storage.Local.Set(extensionID: "HoloflowsKit-UnitTests", object: objectJSON)
        let setScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: set, id: UUID().uuidString))
        let setExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: setScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [setExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        TestHelper.waitCallback(3.0, forTestCase: self)

        XCTAssertEqual(getRealmDataStub().count, 1)
    }

    func testRemove() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        addRealmDataStub()
        XCTAssertEqual(getRealmDataStub().count, 2)

        let remove = WebExtension.Browser.Storage.Local.Remove(extensionID: "HoloflowsKit-UnitTests", keys: ["kitten", "monster"])
        let removeScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: remove, id: UUID().uuidString))
        let removeExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: removeScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [removeExpectation], timeout: 3.0)

        consolePrint(RealmService.default.realm.configuration.fileURL)
        TestHelper.waitCallback(3.0, forTestCase: self)

        XCTAssertEqual(getRealmDataStub().count, 0)
    }

    func testClear() {
        let tab = browser.tabs.create(options: nil)
        TestHelper.prepareTest(tab: tab, forTestCase: self)
        addRealmDataStub()
        XCTAssertEqual(getRealmDataStub().count, 2)

        let clear = WebExtension.Browser.Storage.Local.Clear(extensionID: "HoloflowsKit-UnitTests")
        let clearScript = TestHelper.webKit(messageBody: HoloflowsRPC.Request(params: clear, id: UUID().uuidString))
        let clearExpectation = TestHelper.expectEvaluateJavaScript(in: tab.webView, script: clearScript, forTestCase: self) { (any, error) in
            // do nothing
        }
        wait(for: [clearExpectation], timeout: 3.0)

        XCTAssertEqual(getRealmDataStub().count, 0)
    }

}


extension BrowserStorageLocalTests {

    fileprivate func removeRealmDataStub() {
        let realm = RealmService.default.realm
        // purge database
        let entriesToRemove = realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
        realm.beginWrite()
        realm.delete(entriesToRemove)
        try! realm.commitWrite()
    }

    fileprivate func addRealmDataStub() {
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

    fileprivate func getRealmDataStub() -> [LocalStorage] {
        let realm = RealmService.default.realm
        return realm.objects(LocalStorage.self).filter { ["kitten", "monster"].contains($0.key) }
    }

}
