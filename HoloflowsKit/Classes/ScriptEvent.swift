//
//  ScriptEvent.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-11.
//

import Foundation

public enum ScriptEvent: String, CaseIterable {
    case echo

    case send
    case createObjectURL

    case browserTabsCreate
    case browserTabsRemove
    case browserTabsExecuteScript

    case browserStorageLocalGet
    case browserStorageLocalSet
    case browserStorageLocalRemove
    case browserStorageLocalClear

    case browserRuntimeGetManifest
    case browserRuntimeGetURL

    case browserDownloadsDownload
}


