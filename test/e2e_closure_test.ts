/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

///<reference types="jasmine"/>

import * as fs from 'fs';

import * as closure from './closure';
import * as testSupport from './test_support';
import {goldenTests} from './test_support';

describe('golden file tests', () => {
  beforeEach(() => {
    testSupport.addDiffMatchers();
  });
  it('compile with Closure', (done) => {
    // Declaration tests do not produce .js files.
    const tests = goldenTests().filter(t => !t.isDeclarationTest);
    const goldenJs = ([] as string[]).concat(...tests.map(t => t.jsPaths));
    goldenJs.push('src/closure_externs.js');
    goldenJs.push('third_party/tslib/externs.js');
    goldenJs.push('third_party/tslib/tslib.js');
    goldenJs.push('test_files/augment/shim.js');
    goldenJs.push('test_files/clutz.no_externs/some_name_space.js');
    goldenJs.push('test_files/clutz.no_externs/some_other.js');
    goldenJs.push('test_files/clutz_type_value.no_externs/type_value.js');
    goldenJs.push('test_files/declare/shim.js');
    goldenJs.push('test_files/declare_export_dts/shim.js');
    goldenJs.push('test_files/import_from_goog/closure_Module.js');
    goldenJs.push('test_files/import_from_goog/closure_OtherModule.js');
    goldenJs.push('test_files/export_equals.shim/shim.js');
    goldenJs.push('test_files/type_propaccess.no_externs/nested_clazz.js');
    const externs = tests.map(t => t.externsPath).filter(fs.existsSync);
    const startTime = Date.now();
    const total = goldenJs.length;
    if (!total) throw new Error('No JS files in ' + JSON.stringify(goldenJs));

    const CLOSURE_FLAGS: closure.Flags = {
      // JSC_UNKNOWN_THIS runs during the CollapseProperties pass, so
      // it only fires if you have both:
      // - compilation_level=ADVANCED
      // - checks_only=false (the default)
      // with the latter setting, the compiler output is printed to stdout,
      // but we swallow the stdout below.
      'compilation_level': 'ADVANCED',
      'warning_level': 'VERBOSE',
      'js': goldenJs,
      'externs': externs,
      'language_in': 'ECMASCRIPT6_STRICT',
      'language_out': 'ECMASCRIPT5',
      'jscomp_off': ['lintChecks'],
      'jscomp_error': [
        'accessControls',
        'ambiguousFunctionDecl',
        'checkEventfulObjectDisposal',
        'checkRegExp',
        'checkTypes',
        'checkVars',
        'conformanceViolations',
        'const',
        'constantProperty',
        'deprecated',
        'deprecatedAnnotations',
        'duplicateMessage',
        'es3',
        'es5Strict',
        'externsValidation',
        'fileoverviewTags',
        'functionParams',
        'globalThis',
        'internetExplorerChecks',
        'invalidCasts',
        'misplacedTypeAnnotation',
        'missingGetCssName',
        // disabled: @override currently not implemented by tsickle.
        // 'missingOverride',
        'missingPolyfill',
        'missingProperties',
        'missingProvide',
        'missingRequire',
        'missingReturn',
        'msgDescriptions',
        'nonStandardJsDocs',
        // disabled: too many false positives, not really a workable option.
        // 'reportUnknownTypes',
        'suspiciousCode',
        'strictModuleDepCheck',
        'typeInvalidation',
        'undefinedNames',
        'undefinedVars',
        'unknownDefines',
        // disabled: many tests do not use local vars.
        // 'unusedLocalVariables',
        'unusedPrivateMembers',
        'uselessCode',
        'useOfGoogBase',
        'underscore',
        'visibility',
      ],
      'conformance_configs': 'test_files/conformance.proto',
    };

    // Note: cannot use an async function here because tsetse crashes
    // if you have any async expression in the function body whose result
    // is unused(!).

    closure.compile({}, CLOSURE_FLAGS)
        .then(({exitCode, stdout, stderr}) => {
          const durationMs = Date.now() - startTime;
          console.error('Closure compilation of', total, 'files done after', durationMs, 'ms');
          // Some problems only print as warnings, without a way to promote them to errors.
          // So treat any stderr output as a reason to fail the test.
          if (exitCode !== 0 || stderr.length > 0) {
            // expect() with a message abbreviates the text, so just emit
            // everything here.
            console.error(stderr);
            fail('Closure Compiler warned or errored');
          }
        })
        .catch(err => {
          expect(err).toBe(null);
        })
        .then(() => {
          done();
        });
  }, 60000 /* ms timeout */);
});
