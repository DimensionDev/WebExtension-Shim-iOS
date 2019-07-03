//
//  WebExtension.swift
//  HoloflowsKit
//
//  Created by Cirno MainasuK on 2019-6-22.
//

import Foundation

/// Every RPC request in holoflowsKit is JSON object and should have extension ID field
public protocol WebExtensionClientRequest {
    static var method: String { get }
    
    var extensionID: String { get }
}

public enum WebExtension {

    public typealias ClientRequest = WebExtensionClientRequest & Codable

}

extension WebExtension {

    public enum URL { }

    public enum Browser {
        public enum Runtime { }
        public enum WebNavigation { }
        public enum Tabs { }
        public enum Storage {
            public enum Local { }
        }
        public enum Downloads { }
    }

    public enum ExtensionTypes {

    }

    public enum API: CaseIterable {
        case _echo
        case sendMessage
        case urlCreateObjectURL
        case browserDownloadsDownload
        case browserRuntimeGetURL
        case browserRuntimeGetManifest
        case browserTabsExecuteScript
        case browserTabsCreate
        case browserTabsRemove
        case browserTabsQuery
        case browserStorageLocalGet
        case browserStorageLocalSet
        case browserStorageLocalRemove
        case browserStorageLocalClear
        case browserStorageLocalGetBytesInUse

        public init?(method: String) {
            guard let api = API.allCases.first(where: { $0.method == method }) else {
                return nil
            }

            self = api
        }

        public var method: String {
            switch self {
            case ._echo:                            return WebExtension._Echo.method
            case .sendMessage:                      return WebExtension.SendMessage.method
            case .urlCreateObjectURL:               return WebExtension.URL.CreateObjectURL.method
            case .browserDownloadsDownload:         return WebExtension.Browser.Downloads.Download.method
            case .browserRuntimeGetURL:             return WebExtension.Browser.Runtime.GetURL.method
            case .browserRuntimeGetManifest:        return WebExtension.Browser.Runtime.GetManifest.method
            case .browserTabsExecuteScript:         return WebExtension.Browser.Tabs.ExecuteScript.method
            case .browserTabsCreate:                return WebExtension.Browser.Tabs.Create.method
            case .browserTabsRemove:                return WebExtension.Browser.Tabs.Remove.method
            case .browserTabsQuery:                 return WebExtension.Browser.Tabs.Query.method
            case .browserStorageLocalGet:           return WebExtension.Browser.Storage.Local.Get.method
            case .browserStorageLocalSet:           return WebExtension.Browser.Storage.Local.Set.method
            case .browserStorageLocalRemove:        return WebExtension.Browser.Storage.Local.Remove.method
            case .browserStorageLocalClear:         return WebExtension.Browser.Storage.Local.Clear.method
            case .browserStorageLocalGetBytesInUse: return WebExtension.Browser.Storage.Local.GetBytesInUse.method
            }
        }


    }

}
