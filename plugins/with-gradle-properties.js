const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withCustomGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    const jvmArgsIndex = config.modResults.findIndex(
      (item) => item.type === "property" && item.key === "org.gradle.jvmargs"
    );

    const jvmArgs = {
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx4g -XX:MaxMetaspaceSize=1g",
    };

    if (jvmArgsIndex >= 0) {
      config.modResults[jvmArgsIndex] = jvmArgs;
    } else {
      config.modResults.push(jvmArgs);
    }

    return config;
  });
};
