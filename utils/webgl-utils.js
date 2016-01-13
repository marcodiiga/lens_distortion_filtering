/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */

WebGLUtils = function() {

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @param {function:(msg)} opt_onError An function to call
 *     if there is an error during creation.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {
  function handleCreationError(msg) {
    var container = canvas.parentNode;
    if (container) {
      var str = window.WebGLRenderingContext ?
           OTHER_PROBLEM :
           GET_A_WEBGL_BROWSER;
      if (msg) {
        str += "<br/><br/>Status: " + msg;
      }
      container.innerHTML = makeFailHTML(str);
    }
  };

  opt_onError = opt_onError || handleCreationError;

  if (canvas.addEventListener) {
    canvas.addEventListener("webglcontextcreationerror", function(event) {
          opt_onError(event.statusMessage);
        }, false);
  }
  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    if (!window.WebGLRenderingContext) {
      opt_onError("");
    }
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

return {
  create3DContext: create3DContext,
  setupWebGL: setupWebGL
};
}();

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();


/**
 * Output a WebGL texture into an image for debugging purposes.
 * @param {gl} gl context
 * @param {texture} texture to output (must be stored with UNPACK_FLIP_Y_WEBGL)
 * @param {width} width of the texture
 * @param {height} height of the texture
 * @return {DOMString} The data URI containing a representation
 *         of the image.
 *
 * Example usage:
 *
 *     <img id="debug-img" />
 *
 *     var img = document.getElementById("debug-img");
 *     img.src = createImageFromTexture(gl, texture, texture.width, texture.height);
 */
function createImageFromTexture(gl, texture, width, height) {
  // Create a framebuffer backed by the texture
  var framebuffer;
  ctx = WebGLDebugUtils.makeDebugContext(framebuffer = gl.createFramebuffer());
  ctx = WebGLDebugUtils.makeDebugContext(gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer));
  ctx = WebGLDebugUtils.makeDebugContext(gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0));

  // Read the contents of the framebuffer
  var data = new Uint8Array(width * height * 4);
  var data_flipped = new Uint8Array(width * height * 4);
  ctx = WebGLDebugUtils.makeDebugContext(gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data));
  // Flip webgl data (usually Y-inverse stored)
  for (y = 0; y < height; ++y) {
    for (x = 0; x < width; ++x) {
      data_flipped[y * width * 4 + x * 4] = data[(height - 1 - y) * width * 4 + x * 4];
      data_flipped[y * width * 4 + x * 4 + 1] = data[(height - 1 - y) * width * 4 + x * 4 + 1];
      data_flipped[y * width * 4 + x * 4 + 2] = data[(height - 1 - y) * width * 4 + x * 4 + 2];
      data_flipped[y * width * 4 + x * 4 + 3] = data[(height - 1 - y) * width * 4 + x * 4 + 3];
    }
  }

  ctx = WebGLDebugUtils.makeDebugContext(gl.deleteFramebuffer(framebuffer));

  // Create a 2D canvas to store the result 
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext('2d');

  // Copy the pixels to a 2D canvas
  var imageData = context.createImageData(width, height);
  imageData.data.set(data_flipped);
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}