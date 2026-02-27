const { withDangerousMod, withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin that uses the Icon Composer .icon file for the app icon.
 *
 * How it works:
 * - Copies the .icon file into ios/Neurotype/ (same level as Images.xcassets), renamed to AppIcon.icon
 * - Adds it to the Xcode project with lastKnownFileType = folder.assetcatalog
 *   so actool compiles the icon layers at build time (glass/depth effects rendered by iOS)
 * - Keeps AppIcon.appiconset inside Images.xcassets as fallback for pre-iOS 26 devices
 * - Both use the name "AppIcon" matching ASSETCATALOG_COMPILER_APPICON_NAME
 */
function withCustomIOSIcon(config) {
  // Step 1: Copy .icon file and restore AppIcon.appiconset backup
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName;

      // Copy neurotypelogo.icon → ios/Neurotype/AppIcon.icon (same level as Images.xcassets)
      const iconSrc = path.join(projectRoot, "ios-icon-backup", "neurotypelogo.icon");
      const iconDest = path.join(platformRoot, projectName, "AppIcon.icon");

      if (fs.existsSync(iconSrc)) {
        if (fs.existsSync(iconDest)) {
          fs.rmSync(iconDest, { recursive: true });
        }
        copyDirSync(iconSrc, iconDest);
        console.log("✅ Copied AppIcon.icon to ios/" + projectName + "/");
      }

      // Restore AppIcon.appiconset backup as fallback for older iOS
      const backupDir = path.join(projectRoot, "ios-icon-backup", "AppIcon.appiconset");
      const targetDir = path.join(
        platformRoot,
        projectName,
        "Images.xcassets",
        "AppIcon.appiconset"
      );

      if (fs.existsSync(backupDir)) {
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true });
        }
        copyDirSync(backupDir, targetDir);
        console.log("✅ Restored AppIcon.appiconset from backup");
      }

      return config;
    },
  ]);

  // Step 2: Add AppIcon.icon to Xcode project with folder.assetcatalog type
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const iconFileName = "AppIcon.icon";

    // Check if file reference already exists
    const fileRefs = project.pbxFileReferenceSection();
    let existingFileRefUuid = null;
    for (const key in fileRefs) {
      const ref = fileRefs[key];
      if (typeof ref === "object" && ref.path && ref.path.replace(/"/g, "") === iconFileName) {
        existingFileRefUuid = key;
        break;
      }
    }

    if (!existingFileRefUuid) {
      // Generate UUIDs for the new entries
      const fileRefUuid = project.generateUuid();
      const buildFileUuid = project.generateUuid();

      // 1. Add PBXFileReference with lastKnownFileType = folder.assetcatalog
      project.addToPbxFileReferenceSection({
        uuid: fileRefUuid,
        isa: "PBXFileReference",
        lastKnownFileType: "folder.assetcatalog",
        path: iconFileName,
        sourceTree: '"<group>"',
        name: `"${iconFileName}"`,
      });

      // Also add the comment entry that xcode module expects
      fileRefs[fileRefUuid] = {
        isa: "PBXFileReference",
        lastKnownFileType: "folder.assetcatalog",
        path: `"${iconFileName}"`,
        sourceTree: '"<group>"',
      };
      fileRefs[fileRefUuid + "_comment"] = iconFileName;

      // 2. Add PBXBuildFile referencing the file
      const buildFileSection = project.pbxBuildFileSection();
      buildFileSection[buildFileUuid] = {
        isa: "PBXBuildFile",
        fileRef: fileRefUuid,
        fileRef_comment: iconFileName,
      };
      buildFileSection[buildFileUuid + "_comment"] = iconFileName + " in Resources";

      // 3. Add to the app's PBXGroup children
      const mainGroup = project.pbxGroupByName(projectName);
      if (mainGroup && mainGroup.children) {
        const alreadyInGroup = mainGroup.children.some(
          (child) => child.comment === iconFileName
        );
        if (!alreadyInGroup) {
          mainGroup.children.push({
            value: fileRefUuid,
            comment: iconFileName,
          });
        }
      }

      // 4. Add to PBXResourcesBuildPhase
      const resourcesBuildPhase = project.pbxResourcesBuildPhaseObj();
      if (resourcesBuildPhase && resourcesBuildPhase.files) {
        resourcesBuildPhase.files.push({
          value: buildFileUuid,
          comment: iconFileName + " in Resources",
        });
      }

      console.log("✅ Added AppIcon.icon to Xcode project (folder.assetcatalog)");
    } else {
      console.log("✅ AppIcon.icon already in Xcode project");
    }

    // Ensure ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings && buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME) {
        buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = "AppIcon";
      }
    }

    console.log("✅ Set ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon");
    return config;
  });

  return config;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = withCustomIOSIcon;
