//
//  Browser.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-10.
//

import Foundation
import WebKit
import SwiftyJSON
import ConsolePrint

public class Browser: NSObject {

    public let tabs: Tabs
    weak var core: BrowserCore?

    public init(core: BrowserCore? = nil) {
        let browserCore = core ?? EmptyBrowserCore()
        self.core = browserCore
        self.tabs = Tabs(browserCore: browserCore)
    }

    deinit {
        core = nil
    }

}

fileprivate class EmptyBrowserCore: BrowserCore {

    let coreID = UUID()

    func plugin(forScriptType type: Plugin.ScriptType) -> Plugin {
        return Plugin(id: coreID.uuidString, manifest: JSON.null, environment: type, resources: JSON.null)
    }

}
