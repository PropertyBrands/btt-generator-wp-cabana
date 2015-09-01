'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');
var slug = require('slug');
var sys = require('sys');
var exec = require('child_process').exec;

var wpCabanaTheme = module.exports = function wpCabanaTheme(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // Grab Cabana theme from node_modules
  this.sourceRoot(path.join(__dirname, "../node_modules/wp-theme-cabana/"));

  // Manually assign template path, since sourceRoot moved inside node_modules
  this.templatePath = path.join(__dirname, "templates");

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(wpCabanaTheme, yeoman.generators.Base);

wpCabanaTheme.prototype.askFor = function askFor() {

  var done = this.async();

  // Have Yeoman greet the user.
  this.log(yosay(
    'Welcome to the ' + chalk.red('Wordpress Cabana Theme') + ' generator!'
  ));

  var prompts = [
    {
      name: 'themeName',
      message: 'What is the name of your theme?',
      default: 'cabana'
    },
    {
      name: 'themeNameSpace',
      message: 'Unique name-space for the theme (alphanumeric)?',
      default: function (answers) {
        return answers.themeName.replace(/\W/g, '').toLowerCase();
      }
    },
    {
      name: 'themeAuthor',
      message: 'Name of the theme author?',
      default: 'Bluetent'
    },
    {
      name: 'themeAuthorURI',
      message: 'Website of the themes authors?',
      default: 'http://bluetent.com'
    },
    {
      name: 'themeURI',
      message: 'Website of the theme?',
      default: function (answers) {
        return answers.themeAuthorURI + '/'+ answers.themeName;
      }
    },
    {
      name: 'themeDescription',
      message: 'Description of the theme?',
      default: function (answers) {
        return 'This is a description for the ' + answers.themeName + ' theme.';
      }
    }
  ];

  this.prompt(prompts, function (props) {
    this.themeName = props.themeName;
    this.themeNameSpace = props.themeNameSpace;
    this.themeAuthor = props.themeAuthor;
    this.themeAuthorURI = props.themeAuthorURI;
    this.themeURI = props.themeURI;
    this.themeDescription = props.themeDescription;

    done();
  }.bind(this));
};

function findandreplace(dir) {
  var self = this;

  var files = fs.readdirSync(dir);
  files.forEach(function (file) {
    file = path.join(dir, file);
    var stat = fs.statSync(file);

    if (stat.isFile() && (path.extname(file) == '.php' || path.extname(file) == '.css')) {
      self.log.info('Find and replace cabana in ' + chalk.yellow(file));
      var data = fs.readFileSync(file, 'utf8');
      var result;
      result = data.replace(/Text Domain: cabana/g, "Text Domain: " + slug(self.themeName) + "");
      result = result.replace(/'cabana'/g, "'" + slug(self.themeName) + "'");
      result = result.replace(/cabana_/g, slug(self.themeName) + "_");
      result = result.replace(/ cabana/g, " " + slug(self.themeName));
      result = result.replace(/cabana-/g, slug(self.themeName) + "-");
      if (file == 'style.css') {
        self.log.info('Updating theme information in ' + file);
        result = result.replace(/(Theme Name: )(.+)/g, '$1' + self.themeName);
        result = result.replace(/(Theme URI: )(.+)/g, '$1' + self.themeURI);
        result = result.replace(/(Author: )(.+)/g, '$1' + self.themeAuthor);
        result = result.replace(/(Author URI: )(.+)/g, '$1' + self.themeAuthorURI);
        result = result.replace(/(Description: )(.+)/g, '$1' + self.themeDescription);
        result = result.replace(/(Version: )(.+)/g, '$10.0.1');
        result = result.replace(/(\*\/\n)/, '$1@import url("css/main.css");');
      }
      else if (file == 'footer.php') {
        self.log.info('Updating theme information in ' + file);
        result = result.replace(/http:\/\/automattic.com\//g, self.authorURI);
        result = result.replace(/Automattic/g, self.themeAuthor);
      }
      fs.writeFileSync(file, result, 'utf8');
    }
    else if (stat.isFile() && path.basename(file) == 'cabana.pot') {
      self.log.info('Renaming language file ' + chalk.yellow(file));
      fs.renameSync(file, path.join(path.dirname(file), slug(self.themeName) + '.pot'));
    }
    else if (stat.isFile() && path.basename(file) == 'README.md') {
      self.log.info('Updating ' + chalk.yellow(file));
      var data = fs.readFileSync(file, 'utf8');
      var result = data.replace(/((.|\n)*)Getting Started(.|\n)*/i, '$1');
      fs.writeFileSync(file, result, 'utf8');
    }
    else if (stat.isDirectory()) {
      findandreplace.call(self, file);
    }
  });
}

wpCabanaTheme.prototype.renameunderscores = function renameunderscores() {
  findandreplace.call(this, '.');
  this.log.ok('Done replacing string ' + chalk.yellow('Cabana'));
};


wpCabanaTheme.prototype.app = function () {
  var currentDate = new Date();
  this.themeCreated = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate();
  this.mkdir('icons');
  this.mkdir('fonts');

  // Removed git repository
  exec('echo Removing theme git repo... && rm -rf .git', function(error, stdout, stderr) {
    console.log(stdout);
    return this;
  });

  this.copy(this.templatePath + '/_gulpfile.js', 'Gulpfile.js');
  this.copy(this.templatePath + '/_package.json', 'package.json');
  this.copy(this.templatePath + '/_bower.json', 'bower.json');
  this.copy(this.templatePath + '/scss-lint.yml', '.scss-lint.yml');
  this.copy(this.templatePath + '/editorconfig', '.editorconfig');
  this.copy(this.templatePath + '/jshintrc', '.jshintrc');
  this.copy(this.templatePath + '/bowerrc', '.bowerrc');
};
