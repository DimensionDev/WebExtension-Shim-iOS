#!/bin/bash
set -ev

WebExtension_Shim_Releases="https://48-193638552-gh.circle-artifacts.com/0/WebExtension-shim.js"
WebExtension_Shim_Resources="Source/HoloflowsKit/Resources"

curl --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15" -o webextension-shim.js -L ${WebExtension_Shim_Releases}

mv webextension-shim.js $WebExtension_Shim_Resources/