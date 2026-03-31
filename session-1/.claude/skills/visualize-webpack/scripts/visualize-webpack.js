const path = require('path');

// Accept webpack config path as argument, default to ./client/webpack.config.js
var configPath = process.argv[2] || path.resolve(process.cwd(), 'client', 'webpack.config.js');
if (!path.isAbsolute(configPath)) {
  configPath = path.resolve(process.cwd(), configPath);
}

// Load the webpack config by invoking it with a fake argv
const configFn = require(configPath);
const config = configFn({}, { mode: 'production' });

var lines = [];
lines.push('flowchart TD');

// --- Entry Points ---
lines.push('');
lines.push('  subgraph Entry["Entry Points"]');
for (var name in config.entry) {
  var val = config.entry[name];
  if (Array.isArray(val)) {
    var id = 'entry_' + name.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push('    ' + id + '["' + name + '<br/>' + val.join(', ') + '"]');
  } else {
    var id = 'entry_' + name.replace(/[^a-zA-Z0-9]/g, '_');
    var short = val.replace(config.context || '', '').replace(/^.*[\/\\]client[\/\\]/, '');
    lines.push('    ' + id + '["' + name + '<br/>' + short + '"]');
  }
}
lines.push('  end');

// --- Output ---
lines.push('');
lines.push('  subgraph Output["Output"]');
lines.push('    out_path["path: ' + config.output.path.replace(/^.*[\/\\]client[\/\\]/, '') + '"]');
lines.push('    out_filename["filename: ' + config.output.filename + '"]');
lines.push('    out_chunk["chunkFilename: ' + config.output.chunkFilename + '"]');
lines.push('    out_public["publicPath: ' + config.output.publicPath + '"]');
lines.push('  end');

// Connect entries to output
for (var name in config.entry) {
  var id = 'entry_' + name.replace(/[^a-zA-Z0-9]/g, '_');
  lines.push('  ' + id + ' --> out_path');
}

// --- Loaders ---
lines.push('');
lines.push('  subgraph Loaders["Module Rules / Loaders"]');
var rules = config.module.rules;
for (var i = 0; i < rules.length; i++) {
  var rule = rules[i];
  var testStr = rule.test.toString();
  var rid = 'loader_' + i;

  var loaderNames = [];
  if (rule.use) {
    var uses = Array.isArray(rule.use) ? rule.use : [rule.use];
    for (var j = 0; j < uses.length; j++) {
      var u = uses[j];
      if (typeof u === 'string') loaderNames.push(u.replace(/^.*[\/\\]node_modules[\/\\]/, '').replace(/[\/\\]dist[\/\\]loader\.js$/, ''));
      else if (u.loader) loaderNames.push(u.loader.replace(/^.*[\/\\]node_modules[\/\\]/, '').replace(/[\/\\]dist[\/\\]loader\.js$/, ''));
    }
  } else if (rule.loader) {
    loaderNames.push(rule.loader);
  } else if (rule.type) {
    loaderNames.push(rule.type);
  }

  var label = testStr + '<br/>' + loaderNames.join(' → ');
  lines.push('    ' + rid + '["' + label + '"]');
}
lines.push('  end');

// Connect entries to loaders
for (var name in config.entry) {
  var id = 'entry_' + name.replace(/[^a-zA-Z0-9]/g, '_');
  lines.push('  ' + id + ' --> Loaders');
}

// --- Plugins ---
lines.push('');
lines.push('  subgraph Plugins["Plugins"]');
var pluginDescriptions = {
  HtmlWebpackPlugin: 'Generates index.html<br/>template: src/index.html',
  MiniCssExtractPlugin: 'Extracts CSS into files',
  CopyPlugin: 'Copies src/assets to dist/assets',
  CopyWebpackPlugin: 'Copies src/assets to dist/assets',
  DefinePlugin: 'Defines env vars<br/>API_URL, APP_VERSION',
  BundleAnalyzerPlugin: 'Bundle size report<br/>only with ANALYZE env',
};

var plugins = config.plugins;
for (var i = 0; i < plugins.length; i++) {
  var p = plugins[i];
  var pname = p.constructor.name;
  var pid = 'plugin_' + i;
  var desc = pluginDescriptions[pname] || pname;
  lines.push('    ' + pid + '["' + pname + '<br/>' + desc + '"]');
}
lines.push('  end');

// Connect loaders to plugins
lines.push('  Loaders --> Plugins');

// --- SplitChunks ---
lines.push('');
lines.push('  subgraph SplitChunks["Code Splitting"]');
lines.push('    split_strategy["strategy: ' + config.optimization.splitChunks.chunks + '"]');
var groups = config.optimization.splitChunks.cacheGroups;
for (var gname in groups) {
  var g = groups[gname];
  var gid = 'cache_' + gname;
  var parts = [gname];
  if (g.test) parts.push('test: ' + g.test.toString().replace(/"/g, "'"));
  if (g.minChunks) parts.push('minChunks: ' + g.minChunks);
  if (g.type) parts.push('type: ' + g.type);
  if (g.priority !== undefined) parts.push('priority: ' + g.priority);
  if (g.enforce) parts.push('enforce: true');
  if (g.reuseExistingChunk) parts.push('reuseExisting: true');
  lines.push('    ' + gid + '["' + parts.join('<br/>') + '"]');
  lines.push('    split_strategy --> ' + gid);
}
lines.push('  end');

// --- Minimizers ---
lines.push('');
lines.push('  subgraph Minimizers["Optimization / Minimizers"]');
lines.push('    min_terser["TerserPlugin<br/>drop_console in prod<br/>strip comments"]');
lines.push('    min_css["CssMinimizerPlugin<br/>minify CSS"]');
lines.push('  end');

// Connect plugins to split chunks and minimizers
lines.push('  Plugins --> SplitChunks');
lines.push('  Plugins --> Minimizers');
lines.push('  SplitChunks --> Output');
lines.push('  Minimizers --> Output');

// --- Dev Server ---
lines.push('');
lines.push('  subgraph DevServer["Dev Server"]');
lines.push('    ds_port["port: ' + config.devServer.port + '"]');
lines.push('    ds_hot["HMR: ' + config.devServer.hot + '"]');
lines.push('    ds_history["historyApiFallback: true"]');
var proxies = config.devServer.proxy;
for (var i = 0; i < proxies.length; i++) {
  var px = proxies[i];
  var contexts = px.context.join(', ');
  lines.push('    ds_proxy_' + i + '["proxy: ' + contexts + '<br/>→ ' + px.target + '"]');
}
lines.push('  end');

// --- Aliases ---
lines.push('');
lines.push('  subgraph Aliases["Path Aliases"]');
var aliases = config.resolve.alias;
for (var aname in aliases) {
  var aid = 'alias_' + aname.replace(/[^a-zA-Z0-9]/g, '_');
  var apath = aliases[aname].replace(/^.*[\/\\]client[\/\\]/, '');
  lines.push('    ' + aid + '["' + aname + ' → ' + apath + '"]');
}
lines.push('  end');

// Connect aliases into loaders (aliases affect module resolution)
lines.push('  Aliases --> Loaders');

// Output everything
console.log(lines.join('\n'));
