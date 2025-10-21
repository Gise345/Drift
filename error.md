Running 'gradlew :app:assembleDebug' in /home/expo/workingdir/build/android
Welcome to Gradle 8.10.2!
Here are the highlights of this release:
- Support for Java 23
 - Faster configuration cache
 - Better configuration cache reports
For more details see https://docs.gradle.org/8.10.2/release-notes.html
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.10.2/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:processResources
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:compileKotlin
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar
> Task :gradle-plugin:settings-plugin:compileKotlin
> Task :gradle-plugin:settings-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:settings-plugin:classes
> Task :gradle-plugin:settings-plugin:jar
> Task :gradle-plugin:react-native-gradle-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :expo-updates-gradle-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :expo-dev-launcher-gradle-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :expo-updates-gradle-plugin:pluginDescriptors
> Task :expo-dev-launcher-gradle-plugin:pluginDescriptors
> Task :expo-updates-gradle-plugin:processResources
> Task :expo-dev-launcher-gradle-plugin:processResources
> Task :gradle-plugin:react-native-gradle-plugin:pluginDescriptors
> Task :gradle-plugin:react-native-gradle-plugin:processResources
> Task :gradle-plugin:react-native-gradle-plugin:compileKotlin
> Task :gradle-plugin:react-native-gradle-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:react-native-gradle-plugin:classes
> Task :gradle-plugin:react-native-gradle-plugin:jar
> Task :expo-dev-launcher-gradle-plugin:compileKotlin
> Task :expo-dev-launcher-gradle-plugin:compileJava NO-SOURCE
> Task :expo-dev-launcher-gradle-plugin:classes
> Task :expo-updates-gradle-plugin:compileKotlin
> Task :expo-updates-gradle-plugin:compileJava NO-SOURCE
> Task :expo-updates-gradle-plugin:classes
> Task :expo-dev-launcher-gradle-plugin:jar
> Task :expo-updates-gradle-plugin:jar
> Configure project :app
ℹ️  [33mApplying gradle plugin[0m '[32mexpo-dev-launcher-gradle-plugin[0m' (expo-dev-launcher@5.0.35)
 ℹ️  [33mApplying gradle plugin[0m '[32mexpo-updates-gradle-plugin[0m' (expo-updates@0.27.4)
> Configure project :expo
Using expo modules
  - [32mexpo-application[0m (6.0.2)
  - [32mexpo-asset[0m (11.0.5)
  - [32mexpo-constants[0m (17.0.8)
  - [32mexpo-dev-client[0m (5.0.20)
  - [32mexpo-dev-launcher[0m (5.0.35)
  - [32mexpo-dev-menu[0m (6.0.25)
- [32mexpo-eas-client[0m (0.13.3)
  - [32mexpo-file-system[0m (18.0.12)
  - [32mexpo-font[0m (13.0.4)
  - [32mexpo-json-utils[0m (0.14.0)
  - [32mexpo-keep-awake[0m (14.0.3)
  - [32mexpo-linear-gradient[0m (14.0.2)
  - [32mexpo-linking[0m (7.0.5)
  - [32mexpo-location[0m (18.0.10)
  - [32mexpo-manifests[0m (0.15.8)
  - [32mexpo-modules-core[0m (2.2.3)
  - [32mexpo-notifications[0m (0.29.14)
  - [32mexpo-secure-store[0m (14.0.1)
  - [32mexpo-structured-headers[0m (4.0.0)
  - [32mexpo-updates[0m (0.27.4)
> Configure project :react-native-firebase_app
:react-native-firebase_app package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/app/package.json
:react-native-firebase_app:firebase.bom using default value: 33.12.0
:react-native-firebase_app:play.play-services-auth using default value: 21.3.0
:react-native-firebase_app package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/app/package.json
:react-native-firebase_app:version set from package.json: 21.14.0 (21,14,0 - 21014000)
:react-native-firebase_app:android.compileSdk using custom value: 35
:react-native-firebase_app:android.targetSdk using custom value: 35
:react-native-firebase_app:android.minSdk using custom value: 24
:react-native-firebase_app:reactNativeAndroidDir /home/expo/workingdir/build/node_modules/react-native/android
> Configure project :react-native-firebase_auth
:react-native-firebase_auth package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/auth/package.json
:react-native-firebase_app package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/app/package.json
:react-native-firebase_auth:firebase.bom using default value: 33.12.0
:react-native-firebase_auth package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/auth/package.json
:react-native-firebase_auth:version set from package.json: 21.14.0 (21,14,0 - 21014000)
:react-native-firebase_auth:android.compileSdk using custom value: 35
:react-native-firebase_auth:android.targetSdk using custom value: 35
:react-native-firebase_auth:android.minSdk using custom value: 24
:react-native-firebase_auth:reactNativeAndroidDir /home/expo/workingdir/build/node_modules/react-native/android
> Configure project :react-native-firebase_firestore
:react-native-firebase_firestore package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/firestore/package.json
:react-native-firebase_app package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/app/package.json
:react-native-firebase_firestore:firebase.bom using default value: 33.12.0
:react-native-firebase_firestore package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/firestore/package.json
:react-native-firebase_firestore:version set from package.json: 21.14.0 (21,14,0 - 21014000)
:react-native-firebase_firestore:android.compileSdk using custom value: 35
:react-native-firebase_firestore:android.targetSdk using custom value: 35
:react-native-firebase_firestore:android.minSdk using custom value: 24
:react-native-firebase_firestore:reactNativeAndroidDir /home/expo/workingdir/build/node_modules/react-native/android
> Configure project :react-native-firebase_functions
:react-native-firebase_functions package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/functions/package.json
:react-native-firebase_app package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/app/package.json
:react-native-firebase_functions:firebase.bom using default value: 33.12.0
:react-native-firebase_functions package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/functions/package.json
:react-native-firebase_functions:version set from package.json: 21.14.0 (21,14,0 - 21014000)
:react-native-firebase_functions:android.compileSdk using custom value: 35
:react-native-firebase_functions:android.targetSdk using custom value: 35
:react-native-firebase_functions:android.minSdk using custom value: 24
:react-native-firebase_functions:reactNativeAndroidDir /home/expo/workingdir/build/node_modules/react-native/android
> Configure project :react-native-firebase_storage
:react-native-firebase_storage package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/storage/package.json
:react-native-firebase_app package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/app/package.json
:react-native-firebase_storage:firebase.bom using default value: 33.12.0
:react-native-firebase_storage package.json found at /home/expo/workingdir/build/node_modules/@react-native-firebase/storage/package.json
:react-native-firebase_storage:version set from package.json: 21.14.0 (21,14,0 - 21014000)
:react-native-firebase_storage:android.compileSdk using custom value: 35
:react-native-firebase_storage:android.targetSdk using custom value: 35
:react-native-firebase_storage:android.minSdk using custom value: 24
:react-native-firebase_storage:reactNativeAndroidDir /home/expo/workingdir/build/node_modules/react-native/android
> Task :expo-application:preBuild UP-TO-DATE
> Task :expo-application:preDebugBuild UP-TO-DATE
> Task :expo-asset:preBuild UP-TO-DATE
> Task :expo-asset:preDebugBuild UP-TO-DATE
> Task :expo-application:writeDebugAarMetadata
> Task :expo-asset:writeDebugAarMetadata
> Task :expo-dev-client:preBuild UP-TO-DATE
> Task :expo-dev-client:preDebugBuild UP-TO-DATE
> Task :expo-dev-client:writeDebugAarMetadata
> Task :expo-dev-launcher:preBuild UP-TO-DATE
> Task :expo-dev-launcher:preDebugBuild UP-TO-DATE
> Task :expo-dev-launcher:writeDebugAarMetadata
> Task :expo-dev-menu:preBuild UP-TO-DATE
> Task :expo-dev-menu:preDebugBuild UP-TO-DATE
> Task :expo-dev-menu:writeDebugAarMetadata
> Task :expo-dev-menu-interface:preBuild UP-TO-DATE
> Task :expo-dev-menu-interface:preDebugBuild UP-TO-DATE
> Task :expo-dev-menu-interface:writeDebugAarMetadata
> Task :expo-eas-client:preBuild UP-TO-DATE
> Task :expo-eas-client:preDebugBuild UP-TO-DATE
> Task :expo:generateExpoModulesPackageListTask
> Task :expo:preBuild
> Task :expo:preDebugBuild
> Task :expo-constants:createExpoConfig
> Task :expo-constants:preBuild
> Task :expo-constants:preDebugBuild
> Task :expo-eas-client:writeDebugAarMetadata
> Task :expo-file-system:preBuild UP-TO-DATE
The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set.
Proceeding without mode-specific .env
> Task :expo-file-system:preDebugBuild UP-TO-DATE
> Task :expo:writeDebugAarMetadata
> Task :expo-font:preBuild UP-TO-DATE
> Task :expo-font:preDebugBuild UP-TO-DATE
> Task :expo-constants:writeDebugAarMetadata
> Task :expo-json-utils:preBuild UP-TO-DATE
> Task :expo-json-utils:preDebugBuild UP-TO-DATE
> Task :expo-file-system:writeDebugAarMetadata
> Task :expo-keep-awake:preBuild UP-TO-DATE
> Task :expo-keep-awake:preDebugBuild UP-TO-DATE
> Task :expo-font:writeDebugAarMetadata
> Task :expo-linear-gradient:preBuild UP-TO-DATE
> Task :expo-linear-gradient:preDebugBuild UP-TO-DATE
> Task :expo-json-utils:writeDebugAarMetadata
> Task :expo-linking:preBuild UP-TO-DATE
> Task :expo-linking:preDebugBuild UP-TO-DATE
> Task :expo-keep-awake:writeDebugAarMetadata
> Task :expo-location:preBuild UP-TO-DATE
> Task :expo-location:preDebugBuild UP-TO-DATE
> Task :expo-linear-gradient:writeDebugAarMetadata
> Task :expo-manifests:preBuild UP-TO-DATE
> Task :expo-manifests:preDebugBuild UP-TO-DATE
> Task :expo-location:writeDebugAarMetadata
> Task :expo-modules-core:preBuild UP-TO-DATE
> Task :expo-modules-core:preDebugBuild UP-TO-DATE
> Task :expo-manifests:writeDebugAarMetadata
> Task :expo-notifications:preBuild UP-TO-DATE
> Task :expo-notifications:preDebugBuild UP-TO-DATE
> Task :expo-linking:writeDebugAarMetadata
> Task :expo-secure-store:preBuild UP-TO-DATE
> Task :expo-secure-store:preDebugBuild UP-TO-DATE
> Task :expo-modules-core:writeDebugAarMetadata
> Task :expo-structured-headers:preBuild UP-TO-DATE
> Task :expo-structured-headers:preDebugBuild UP-TO-DATE
> Task :expo-notifications:writeDebugAarMetadata
> Task :expo-updates:preBuild UP-TO-DATE
> Task :expo-updates:preDebugBuild UP-TO-DATE
> Task :expo-structured-headers:writeDebugAarMetadata
> Task :expo-updates-interface:preBuild UP-TO-DATE
> Task :expo-updates-interface:preDebugBuild UP-TO-DATE
> Task :expo-updates:writeDebugAarMetadata
> Task :expo-updates-interface:writeDebugAarMetadata
> Task :react-native-firebase_app:preBuild UP-TO-DATE
> Task :react-native-firebase_app:preDebugBuild UP-TO-DATE
> Task :expo-secure-store:writeDebugAarMetadata
> Task :react-native-firebase_auth:preBuild UP-TO-DATE
> Task :react-native-firebase_auth:preDebugBuild UP-TO-DATE
> Task :react-native-firebase_app:writeDebugAarMetadata
> Task :react-native-firebase_firestore:preBuild UP-TO-DATE
> Task :react-native-firebase_firestore:preDebugBuild UP-TO-DATE
> Task :react-native-firebase_auth:writeDebugAarMetadata
> Task :react-native-firebase_functions:preBuild UP-TO-DATE
> Task :react-native-firebase_functions:preDebugBuild UP-TO-DATE
> Task :react-native-firebase_functions:writeDebugAarMetadata
> Task :react-native-firebase_storage:preBuild UP-TO-DATE
> Task :react-native-firebase_storage:preDebugBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:generateCodegenSchemaFromJavaScript
> Task :react-native-firebase_storage:writeDebugAarMetadata
> Task :react-native-firebase_firestore:writeDebugAarMetadata
> Task :react-native-async-storage_async-storage:generateCodegenArtifactsFromSchema
> Task :react-native-async-storage_async-storage:preBuild
> Task :react-native-async-storage_async-storage:preDebugBuild
> Task :react-native-async-storage_async-storage:writeDebugAarMetadata
> Task :react-native-maps:preBuild UP-TO-DATE
> Task :react-native-maps:preDebugBuild UP-TO-DATE
> Task :react-native-maps:writeDebugAarMetadata
> Task :react-native-google-signin_google-signin:generateCodegenSchemaFromJavaScript
> Task :react-native-safe-area-context:generateCodegenSchemaFromJavaScript
> Task :react-native-safe-area-context:generateCodegenArtifactsFromSchema
> Task :react-native-google-signin_google-signin:generateCodegenArtifactsFromSchema
> Task :react-native-safe-area-context:preBuild
> Task :react-native-google-signin_google-signin:preBuild
> Task :react-native-safe-area-context:preDebugBuild
> Task :react-native-google-signin_google-signin:preDebugBuild
> Task :react-native-google-signin_google-signin:writeDebugAarMetadata
> Task :react-native-safe-area-context:writeDebugAarMetadata
> Task :react-native-screens:generateCodegenSchemaFromJavaScript
> Task :react-native-vector-icons:generateCodegenSchemaFromJavaScript
> Task :react-native-screens:generateCodegenArtifactsFromSchema
> Task :react-native-screens:preBuild
> Task :react-native-screens:preDebugBuild
> Task :react-native-screens:writeDebugAarMetadata
> Task :expo:generateDebugResValues
> Task :expo:generateDebugResources
> Task :react-native-vector-icons:generateCodegenArtifactsFromSchema
> Task :react-native-vector-icons:preBuild
> Task :react-native-vector-icons:preDebugBuild
> Task :react-native-vector-icons:writeDebugAarMetadata
> Task :expo-application:generateDebugResValues
> Task :expo-application:generateDebugResources
> Task :expo:packageDebugResources
> Task :expo-asset:generateDebugResValues
> Task :expo-asset:generateDebugResources
> Task :expo-application:packageDebugResources
> Task :expo-constants:generateDebugResValues
> Task :expo-constants:generateDebugResources
> Task :expo-asset:packageDebugResources
> Task :expo-dev-client:generateDebugResValues
> Task :expo-dev-client:generateDebugResources
> Task :expo-constants:packageDebugResources
> Task :expo-dev-launcher:generateDebugResValues
> Task :expo-dev-client:packageDebugResources
> Task :expo-dev-menu:generateDebugResValues
> Task :expo-dev-launcher:generateDebugResources
> Task :expo-dev-menu:generateDebugResources
> Task :expo-dev-menu:packageDebugResources
> Task :expo-dev-menu-interface:generateDebugResValues
> Task :expo-dev-menu-interface:generateDebugResources
> Task :expo-dev-menu-interface:packageDebugResources
> Task :expo-eas-client:generateDebugResValues
> Task :expo-eas-client:generateDebugResources
> Task :expo-eas-client:packageDebugResources
> Task :expo-file-system:generateDebugResValues
> Task :expo-file-system:generateDebugResources
> Task :expo-file-system:packageDebugResources
> Task :expo-font:generateDebugResValues
> Task :expo-font:generateDebugResources
> Task :expo-font:packageDebugResources
> Task :expo-json-utils:generateDebugResValues
> Task :expo-json-utils:generateDebugResources
> Task :expo-json-utils:packageDebugResources
> Task :expo-keep-awake:generateDebugResValues
> Task :expo-keep-awake:generateDebugResources
> Task :expo-keep-awake:packageDebugResources
> Task :expo-linear-gradient:generateDebugResValues
> Task :expo-linear-gradient:generateDebugResources
> Task :expo-linear-gradient:packageDebugResources
> Task :expo-linking:generateDebugResValues
> Task :expo-linking:generateDebugResources
> Task :expo-linking:packageDebugResources
> Task :expo-location:generateDebugResValues
> Task :expo-location:generateDebugResources
> Task :expo-location:packageDebugResources
> Task :expo-manifests:generateDebugResValues
> Task :expo-manifests:generateDebugResources
> Task :expo-manifests:packageDebugResources
> Task :expo-modules-core:generateDebugResValues
> Task :expo-modules-core:generateDebugResources
> Task :expo-modules-core:packageDebugResources
> Task :expo-notifications:generateDebugResValues
> Task :expo-notifications:generateDebugResources
> Task :expo-notifications:packageDebugResources
> Task :expo-secure-store:generateDebugResValues
> Task :expo-secure-store:generateDebugResources
> Task :expo-secure-store:packageDebugResources
> Task :expo-structured-headers:generateDebugResValues
> Task :expo-structured-headers:generateDebugResources
> Task :expo-dev-launcher:packageDebugResources
> Task :expo-structured-headers:packageDebugResources
> Task :expo-updates:generateDebugResValues
> Task :expo-updates-interface:generateDebugResValues
> Task :expo-updates-interface:generateDebugResources
> Task :expo-updates:generateDebugResources
> Task :expo-updates:packageDebugResources
> Task :react-native-async-storage_async-storage:generateDebugResValues
> Task :react-native-async-storage_async-storage:generateDebugResources
> Task :expo-updates-interface:packageDebugResources
> Task :react-native-async-storage_async-storage:packageDebugResources
> Task :react-native-firebase_app:generateDebugResValues
> Task :react-native-firebase_app:generateDebugResources
> Task :react-native-firebase_auth:generateDebugResValues
> Task :react-native-firebase_auth:generateDebugResources
> Task :react-native-firebase_app:packageDebugResources
> Task :react-native-firebase_firestore:generateDebugResValues
> Task :react-native-firebase_auth:packageDebugResources
> Task :react-native-firebase_functions:generateDebugResValues
> Task :react-native-firebase_firestore:generateDebugResources
> Task :react-native-firebase_functions:generateDebugResources
> Task :react-native-firebase_firestore:packageDebugResources
> Task :react-native-firebase_storage:generateDebugResValues
> Task :react-native-firebase_functions:packageDebugResources
> Task :react-native-google-signin_google-signin:generateDebugResValues
> Task :react-native-firebase_storage:generateDebugResources
> Task :react-native-google-signin_google-signin:generateDebugResources
> Task :react-native-google-signin_google-signin:packageDebugResources
> Task :react-native-firebase_storage:packageDebugResources
> Task :react-native-maps:generateDebugResValues
> Task :react-native-safe-area-context:generateDebugResValues
> Task :react-native-maps:generateDebugResources
> Task :react-native-safe-area-context:generateDebugResources
> Task :react-native-maps:packageDebugResources
> Task :react-native-safe-area-context:packageDebugResources
> Task :react-native-screens:generateDebugResValues
> Task :react-native-vector-icons:generateDebugResValues
> Task :react-native-vector-icons:generateDebugResources
> Task :react-native-screens:generateDebugResources
> Task :react-native-vector-icons:packageDebugResources
> Task :expo:extractDeepLinksDebug
> Task :react-native-screens:packageDebugResources
> Task :expo-application:extractDeepLinksDebug
> Task :expo-application:processDebugManifest
> Task :expo:processDebugManifest
> Task :expo-constants:extractDeepLinksDebug
> Task :expo-asset:extractDeepLinksDebug
> Task :expo-constants:processDebugManifest
> Task :expo-asset:processDebugManifest
> Task :expo-dev-launcher:extractDeepLinksDebug
> Task :expo-dev-client:extractDeepLinksDebug
> Task :expo-dev-client:processDebugManifest
> Task :expo-dev-menu:extractDeepLinksDebug
> Task :expo-dev-launcher:processDebugManifest
> Task :expo-dev-menu:processDebugManifest
> Task :expo-dev-menu-interface:extractDeepLinksDebug
> Task :expo-eas-client:extractDeepLinksDebug
> Task :expo-dev-menu-interface:processDebugManifest
> Task :expo-eas-client:processDebugManifest
> Task :expo-file-system:extractDeepLinksDebug
> Task :expo-font:extractDeepLinksDebug
> Task :expo-font:processDebugManifest
> Task :expo-file-system:processDebugManifest
/home/expo/workingdir/build/node_modules/expo-file-system/android/src/main/AndroidManifest.xml:6:9-8:20 Warning:
	provider#expo.modules.filesystem.FileSystemFileProvider@android:authorities was tagged at AndroidManifest.xml:6 to replace other declarations but no other declaration present
> Task :expo-json-utils:extractDeepLinksDebug
> Task :expo-keep-awake:extractDeepLinksDebug
> Task :expo-keep-awake:processDebugManifest
> Task :expo-json-utils:processDebugManifest
> Task :expo-linking:extractDeepLinksDebug
> Task :expo-linear-gradient:extractDeepLinksDebug
> Task :expo-linking:processDebugManifest
> Task :expo-location:extractDeepLinksDebug
> Task :expo-linear-gradient:processDebugManifest
> Task :expo-manifests:extractDeepLinksDebug
> Task :expo-manifests:processDebugManifest
> Task :expo-location:processDebugManifest
> Task :expo-notifications:extractDeepLinksDebug
> Task :expo-modules-core:extractDeepLinksDebug
> Task :expo-modules-core:processDebugManifest
/home/expo/workingdir/build/node_modules/expo-modules-core/android/src/main/AndroidManifest.xml:8:9-11:45 Warning:
	meta-data#com.facebook.soloader.enabled@android:value was tagged at AndroidManifest.xml:8 to replace other declarations but no other declaration present
> Task :expo-notifications:processDebugManifest
> Task :expo-secure-store:extractDeepLinksDebug
> Task :expo-structured-headers:extractDeepLinksDebug
> Task :expo-secure-store:processDebugManifest
> Task :expo-structured-headers:processDebugManifest
> Task :expo-updates:extractDeepLinksDebug
> Task :expo-updates-interface:extractDeepLinksDebug
> Task :expo-updates-interface:processDebugManifest
> Task :expo-updates:processDebugManifest
> Task :react-native-firebase_app:extractDeepLinksDebug
> Task :react-native-async-storage_async-storage:extractDeepLinksDebug
> Task :react-native-async-storage_async-storage:processDebugManifest
package="com.reactnativecommunity.asyncstorage" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.reactnativecommunity.asyncstorage" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
> Task :react-native-firebase_auth:extractDeepLinksDebug
> Task :react-native-firebase_app:processDebugManifest
package="io.invertase.firebase" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/app/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="io.invertase.firebase" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/app/android/src/main/AndroidManifest.xml.
> Task :react-native-firebase_firestore:extractDeepLinksDebug
> Task :react-native-firebase_auth:processDebugManifest
package="io.invertase.firebase.auth" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/auth/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="io.invertase.firebase.auth" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/auth/android/src/main/AndroidManifest.xml.
> Task :react-native-firebase_functions:extractDeepLinksDebug
> Task :react-native-firebase_firestore:processDebugManifest
package="io.invertase.firebase.firestore" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/firestore/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="io.invertase.firebase.firestore" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/firestore/android/src/main/AndroidManifest.xml.
> Task :react-native-firebase_functions:processDebugManifest
package="io.invertase.firebase.functions" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/functions/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="io.invertase.firebase.functions" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/functions/android/src/main/AndroidManifest.xml.
> Task :react-native-firebase_storage:extractDeepLinksDebug
> Task :react-native-google-signin_google-signin:extractDeepLinksDebug
> Task :react-native-google-signin_google-signin:processDebugManifest
package="com.reactnativegooglesignin" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-google-signin/google-signin/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.reactnativegooglesignin" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-google-signin/google-signin/android/src/main/AndroidManifest.xml.
> Task :react-native-firebase_storage:processDebugManifest
package="io.invertase.firebase.storage" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/storage/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="io.invertase.firebase.storage" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/@react-native-firebase/storage/android/src/main/AndroidManifest.xml.
> Task :react-native-maps:extractDeepLinksDebug
> Task :react-native-safe-area-context:extractDeepLinksDebug
> Task :react-native-safe-area-context:processDebugManifest
package="com.th3rdwave.safeareacontext" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.th3rdwave.safeareacontext" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
> Task :react-native-maps:processDebugManifest
> Task :react-native-screens:extractDeepLinksDebug
> Task :react-native-vector-icons:extractDeepLinksDebug
> Task :react-native-vector-icons:processDebugManifest
package="com.oblador.vectoricons" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-vector-icons/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.oblador.vectoricons" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-vector-icons/android/src/main/AndroidManifest.xml.
> Task :react-native-screens:processDebugManifest
package="com.swmansion.rnscreens" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.swmansion.rnscreens" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/react-native-screens/android/src/main/AndroidManifest.xml.
> Task :expo:compileDebugLibraryResources
> Task :expo-application:compileDebugLibraryResources
> Task :expo:parseDebugLocalResources
> Task :expo-application:parseDebugLocalResources
> Task :expo:generateDebugRFile
> Task :expo-asset:compileDebugLibraryResources
> Task :expo-asset:parseDebugLocalResources
> Task :expo-asset:generateDebugRFile
> Task :expo-application:generateDebugRFile
> Task :expo-constants:compileDebugLibraryResources
> Task :expo-dev-client:compileDebugLibraryResources
> Task :expo-constants:parseDebugLocalResources
> Task :expo-dev-client:parseDebugLocalResources
> Task :expo-constants:generateDebugRFile
> Task :expo-dev-client:generateDebugRFile
> Task :expo-dev-launcher:parseDebugLocalResources
> Task :expo-dev-launcher:compileDebugLibraryResources
> Task :expo-dev-launcher:generateDebugRFile
> Task :expo-dev-menu-interface:compileDebugLibraryResources
> Task :expo-dev-menu:parseDebugLocalResources
> Task :expo-dev-menu:generateDebugRFile
> Task :expo-dev-menu:compileDebugLibraryResources
> Task :expo-eas-client:compileDebugLibraryResources
> Task :expo-dev-menu-interface:parseDebugLocalResources
> Task :expo-eas-client:parseDebugLocalResources
> Task :expo-dev-menu-interface:generateDebugRFile
> Task :expo-file-system:compileDebugLibraryResources
> Task :expo-eas-client:generateDebugRFile
> Task :expo-file-system:parseDebugLocalResources
> Task :expo-font:compileDebugLibraryResources
> Task :expo-font:parseDebugLocalResources
> Task :expo-file-system:generateDebugRFile
> Task :expo-json-utils:compileDebugLibraryResources
> Task :expo-keep-awake:compileDebugLibraryResources
> Task :expo-font:generateDebugRFile
> Task :expo-keep-awake:parseDebugLocalResources
> Task :expo-json-utils:parseDebugLocalResources
> Task :expo-linear-gradient:compileDebugLibraryResources
> Task :expo-keep-awake:generateDebugRFile
> Task :expo-linear-gradient:parseDebugLocalResources
> Task :expo-json-utils:generateDebugRFile
> Task :expo-linking:compileDebugLibraryResources
> Task :expo-linear-gradient:generateDebugRFile
> Task :expo-location:compileDebugLibraryResources
> Task :expo-linking:parseDebugLocalResources
> Task :expo-manifests:compileDebugLibraryResources
> Task :expo-location:parseDebugLocalResources
> Task :expo-linking:generateDebugRFile
> Task :expo-modules-core:compileDebugLibraryResources
> Task :expo-manifests:parseDebugLocalResources
> Task :expo-location:generateDebugRFile
> Task :expo-modules-core:parseDebugLocalResources
> Task :expo-manifests:generateDebugRFile
> Task :expo-notifications:compileDebugLibraryResources
> Task :expo-modules-core:generateDebugRFile
> Task :expo-notifications:parseDebugLocalResources
> Task :expo-secure-store:compileDebugLibraryResources
> Task :expo-structured-headers:compileDebugLibraryResources
> Task :expo-secure-store:parseDebugLocalResources
> Task :expo-notifications:generateDebugRFile
> Task :expo-structured-headers:parseDebugLocalResources
> Task :expo-secure-store:generateDebugRFile
> Task :expo-updates:compileDebugLibraryResources
> Task :expo-updates-interface:compileDebugLibraryResources
> Task :expo-structured-headers:generateDebugRFile
> Task :react-native-async-storage_async-storage:compileDebugLibraryResources
> Task :expo-updates:parseDebugLocalResources
> Task :expo-updates-interface:parseDebugLocalResources
> Task :react-native-async-storage_async-storage:parseDebugLocalResources
> Task :react-native-async-storage_async-storage:generateDebugRFile
> Task :expo-updates:generateDebugRFile
> Task :expo-updates-interface:generateDebugRFile
> Task :react-native-firebase_app:compileDebugLibraryResources
> Task :react-native-firebase_auth:compileDebugLibraryResources
> Task :react-native-firebase_firestore:compileDebugLibraryResources
> Task :react-native-firebase_firestore:parseDebugLocalResources
> Task :react-native-firebase_app:parseDebugLocalResources
> Task :react-native-firebase_auth:parseDebugLocalResources
> Task :react-native-firebase_auth:generateDebugRFile
> Task :react-native-firebase_firestore:generateDebugRFile
> Task :react-native-firebase_app:generateDebugRFile
> Task :react-native-firebase_storage:compileDebugLibraryResources
> Task :react-native-firebase_functions:compileDebugLibraryResources
> Task :react-native-firebase_functions:parseDebugLocalResources
> Task :react-native-firebase_functions:generateDebugRFile
> Task :react-native-google-signin_google-signin:compileDebugLibraryResources
> Task :react-native-firebase_storage:parseDebugLocalResources
> Task :react-native-maps:compileDebugLibraryResources
> Task :react-native-google-signin_google-signin:parseDebugLocalResources
> Task :react-native-google-signin_google-signin:generateDebugRFile
> Task :react-native-firebase_storage:generateDebugRFile
> Task :react-native-maps:parseDebugLocalResources
> Task :react-native-safe-area-context:compileDebugLibraryResources
> Task :react-native-safe-area-context:parseDebugLocalResources
> Task :react-native-maps:generateDebugRFile
> Task :react-native-safe-area-context:generateDebugRFile
> Task :react-native-screens:parseDebugLocalResources
> Task :react-native-screens:compileDebugLibraryResources
> Task :react-native-vector-icons:compileDebugLibraryResources
> Task :react-native-screens:generateDebugRFile
> Task :react-native-vector-icons:parseDebugLocalResources
> Task :expo:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-vector-icons:generateDebugRFile
> Task :expo-application:checkKotlinGradlePluginConfigurationErrors
> Task :expo:generateDebugBuildConfig
> Task :expo-application:generateDebugBuildConfig
> Task :expo-modules-core:checkKotlinGradlePluginConfigurationErrors
> Task :expo-asset:checkKotlinGradlePluginConfigurationErrors
> Task :expo-modules-core:generateDebugBuildConfig
> Task :expo-asset:generateDebugBuildConfig
> Task :expo-application:javaPreCompileDebug
> Task :expo-constants:checkKotlinGradlePluginConfigurationErrors
> Task :expo-asset:javaPreCompileDebug
> Task :expo-dev-client:checkKotlinGradlePluginConfigurationErrors
> Task :expo-constants:generateDebugBuildConfig
> Task :expo-constants:javaPreCompileDebug
> Task :expo-dev-launcher:checkKotlinGradlePluginConfigurationErrors
> Task :app:generateAutolinkingNewArchitectureFiles
> Task :app:generateAutolinkingPackageList
> Task :app:generateCodegenSchemaFromJavaScript SKIPPED
> Task :app:generateCodegenArtifactsFromSchema SKIPPED
> Task :app:preBuild
> Task :app:preDebugBuild
> Task :app:mergeDebugNativeDebugMetadata NO-SOURCE
> Task :app:checkKotlinGradlePluginConfigurationErrors
> Task :app:generateDebugBuildConfig
> Task :expo-dev-client:dataBindingMergeDependencyArtifactsDebug
> Task :expo-modules-core:javaPreCompileDebug
> Task :app:checkDebugAarMetadata
> Task :expo-dev-launcher:dataBindingMergeDependencyArtifactsDebug
> Task :app:generateDebugResValues
> Task :app:processDebugGoogleServices
> Task :expo-dev-client:dataBindingGenBaseClassesDebug
> Task :expo-dev-client:generateDebugBuildConfig
> Task :expo-dev-client:javaPreCompileDebug
> Task :expo-dev-menu:checkKotlinGradlePluginConfigurationErrors
> Task :expo-dev-menu:generateDebugBuildConfig
> Task :expo-dev-menu-interface:checkKotlinGradlePluginConfigurationErrors
> Task :expo-dev-menu-interface:generateDebugBuildConfig
> Task :expo-dev-menu-interface:javaPreCompileDebug
> Task :expo-json-utils:checkKotlinGradlePluginConfigurationErrors
> Task :expo-json-utils:generateDebugBuildConfig
> Task :expo-json-utils:javaPreCompileDebug
> Task :expo-manifests:checkKotlinGradlePluginConfigurationErrors
> Task :expo-manifests:generateDebugBuildConfig
> Task :expo-manifests:javaPreCompileDebug
> Task :expo-dev-menu:javaPreCompileDebug
> Task :expo-updates-interface:checkKotlinGradlePluginConfigurationErrors
> Task :expo-updates-interface:generateDebugBuildConfig
> Task :app:mapDebugSourceSetPaths
> Task :app:generateDebugResources
> Task :expo-updates-interface:javaPreCompileDebug
> Task :expo-eas-client:checkKotlinGradlePluginConfigurationErrors
> Task :expo-eas-client:generateDebugBuildConfig
> Task :expo-eas-client:javaPreCompileDebug
> Task :expo-file-system:checkKotlinGradlePluginConfigurationErrors
> Task :expo-file-system:generateDebugBuildConfig
> Task :expo-file-system:javaPreCompileDebug
> Task :expo-font:checkKotlinGradlePluginConfigurationErrors
> Task :expo-font:generateDebugBuildConfig
> Task :expo-font:javaPreCompileDebug
> Task :expo-keep-awake:checkKotlinGradlePluginConfigurationErrors
> Task :expo-keep-awake:generateDebugBuildConfig
> Task :expo-keep-awake:javaPreCompileDebug
> Task :expo-linear-gradient:checkKotlinGradlePluginConfigurationErrors
> Task :expo-linear-gradient:generateDebugBuildConfig
> Task :expo-linear-gradient:javaPreCompileDebug
> Task :expo-linking:checkKotlinGradlePluginConfigurationErrors
> Task :expo-linking:generateDebugBuildConfig
> Task :expo-dev-launcher:dataBindingGenBaseClassesDebug
> Task :expo-linking:javaPreCompileDebug
> Task :expo-dev-launcher:generateDebugBuildConfig
> Task :expo-dev-launcher:javaPreCompileDebug
> Task :expo-location:checkKotlinGradlePluginConfigurationErrors
> Task :expo-notifications:checkKotlinGradlePluginConfigurationErrors
> Task :expo-location:generateDebugBuildConfig
> Task :expo-notifications:generateDebugBuildConfig
> Task :expo-location:javaPreCompileDebug
> Task :expo-notifications:javaPreCompileDebug
> Task :expo-secure-store:checkKotlinGradlePluginConfigurationErrors
> Task :expo-structured-headers:checkKotlinGradlePluginConfigurationErrors
> Task :expo-secure-store:generateDebugBuildConfig
> Task :expo-structured-headers:generateDebugBuildConfig
> Task :expo-secure-store:javaPreCompileDebug
> Task :expo-updates:checkKotlinGradlePluginConfigurationErrors
> Task :expo-structured-headers:javaPreCompileDebug
> Task :expo:javaPreCompileDebug
> Task :expo-updates:generateDebugBuildConfig
> Task :react-native-async-storage_async-storage:generateDebugBuildConfig
> Task :react-native-async-storage_async-storage:javaPreCompileDebug
> Task :app:mergeDebugResources
> Task :app:packageDebugResources
> Task :app:parseDebugLocalResources
> Task :app:createDebugCompatibleScreenManifests
> Task :app:extractDeepLinksDebug
> Task :expo-updates:javaPreCompileDebug
> Task :react-native-firebase_app:generateDebugBuildConfig
> Task :react-native-firebase_app:javaPreCompileDebug
> Task :app:processDebugMainManifest FAILED
See https://developer.android.com/r/studio-ui/build/manifest-merger for more information about the manifest merger.
/home/expo/workingdir/build/android/app/src/main/AndroidManifest.xml:17:62-112 Error:
	Attribute meta-data#com.google.android.geo.API_KEY@value at AndroidManifest.xml:17:62-112 requires a placeholder substitution but no value for <EXPO_PUBLIC_GOOGLE_MAPS_API_KEY> is provided.
/home/expo/workingdir/build/android/app/src/debug/AndroidManifest.xml Error:
	Validation failed, exiting
> Task :react-native-async-storage_async-storage:compileDebugJavaWithJavac
/home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageModule.java:84: warning: [removal] onCatalystInstanceDestroy() in NativeModule has been deprecated and marked for removal
  public void onCatalystInstanceDestroy() {
              ^
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: /home/expo/workingdir/build/node_modules/@react-native-async-storage/async-storage/android/src/javaPackage/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java uses unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
1 warning
> Task :react-native-firebase_app:compileDebugJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
> Task :expo-modules-core:compileDebugKotlin
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:processDebugMainManifest'.
> Manifest merger failed with multiple errors, see logs
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
BUILD FAILED in 2m 27s
436 actionable tasks: 436 executed
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.