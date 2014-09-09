module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/safenames.js',
        dest: 'index.js'
      }
    },
	nodeunit: {
		all: {
			src: ['src/*.js','test/*.js'],
			dest: 'README.md'
		}
	},
	gendocs: {
		all: {
			src: 'src/safenames.js',
			dest: 'README.md'
		}
	}
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerMultiTask('gendocs', "generate README.md", function(){
	
	var done = this.async();
	var gendocs = require('gendocs');
	gendocs(null, function(err, output) {
		if (err) {
		  grunt.fail.warn(err);
		}
		else {
			try {
				grunt.file.write("README.md",output);
			}
			catch(err){
				grunt.fail.warn(err);
			}
		}
		done();
	});
  });

  grunt.registerTask('default', ['newer:uglify', 'newer:nodeunit', 'newer:gendocs']);

};