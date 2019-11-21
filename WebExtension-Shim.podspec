Pod::Spec.new do |s|
  s.name             = 'WebExtension-Shim'
  s.version          = '0.3.7'
  s.summary          = 'WebExtension-Shim on iOS.'


  s.description      = <<-DESC
WebExtension-Shim for WKWebView. Drive the several basic web extension API to function your plugin.
                       DESC

  s.homepage         = 'https://github.com/SujiTech/WebExtension-Shim-iOS'
  s.license          = { :type => 'AGPL', :file => 'LICENSE' }
  s.author           = { 'CMK' => 'cirno.mainasuk@gmail.com' }
  s.source           = { :git => 'https://github.com/SujiTech/WebExtension-Shim-iOS.git', :tag => s.version.to_s }
  s.swift_version    = '5.0'

  # s.prepare_command = <<-CMD
  #   Source/HoloflowsKit/build.sh
  # CMD

  s.ios.deployment_target = '11.0'

  s.default_subspec = 'WebExtension-Shim'

  s.source_files = 'Source/**/*'

  s.subspec 'WebExtension-Shim' do |default_spec|
    default_spec.source_files = 'Source/WebExtension-Shim/Classes/**/*'

    default_spec.resource_bundles = {
      'WebExtensionShimScripts' => ['Source/WebExtension-Shim/Resources/*']
    }

    default_spec.dependency 'RealmSwift'
    default_spec.dependency 'Alamofire', '~> 4.7'
    default_spec.dependency 'AlamofireNetworkActivityLogger', '~> 2.4'
    default_spec.dependency 'WebExtension-Shim/JSONRPC'
  end

  s.subspec 'JSONRPC' do |jsonRPC|
    jsonRPC.source_files = 'Source/JSONRPC/Classes/**/*'
  end

  s.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'Tests/**/*.swift'
    test_spec.resources = 'Tests/**/*.{html,tiff}'
  end

  s.dependency 'SwiftyJSON', '~> 5.0.0'
  s.dependency 'ConsolePrint'
  
end
