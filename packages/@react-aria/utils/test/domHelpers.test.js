/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */


import {getOwnerWindow, getRootNode} from '../';
import React, {createRef} from 'react';
import {render} from '@react-spectrum/test-utils';

describe('getRootNode', () => {
  test.each([null, undefined])('returns the document if the argument is %p', (value) => {
    expect(getRootNode(value)).toBe(document);
  });

  it('returns the document if the element is in the document', () => {
    const div = document.createElement('div');
    window.document.body.appendChild(div);
    expect(getRootNode(div)).toBe(document);
  });

  it('returns the document if object passed in does not have an ownerdocument', () => {
    const div = document.createElement('div');
    expect(getRootNode(div)).toBe(document);
  });

  it('returns the document if nothing is passed in', () => {
    expect(getRootNode()).toBe(document);
    expect(getRootNode(null)).toBe(document);
    expect(getRootNode(undefined)).toBe(document);
  });

  it('returns the document if ref exists, but is not associated with an element', () => {
    const ref = createRef();

    expect(getRootNode(ref.current)).toBe(document);
  });

  it("returns the iframe's document if the element is in an iframe", () => {
    const iframe = document.createElement('iframe');
    const iframeDiv = document.createElement('div');
    window.document.body.appendChild(iframe);
    iframe.contentWindow.document.body.appendChild(iframeDiv);

    expect(getRootNode(iframeDiv)).not.toBe(document);
    expect(getRootNode(iframeDiv)).toBe(iframe.contentWindow.document);
    expect(getRootNode(iframeDiv)).toBe(iframe.contentDocument);

    // Teardown
    iframe.remove();
  });

  it("returns the iframe's document if the ref is in an iframe", () => {
    const ref = createRef();
    const iframe = document.createElement('iframe');
    const iframeDiv = document.createElement('div');
    window.document.body.appendChild(iframe);
    iframe.contentWindow.document.body.appendChild(iframeDiv);

    render(<div ref={ref} />, {
      container: iframeDiv
    });

    expect(getRootNode(ref.current)).not.toBe(document);
    expect(getRootNode(ref.current)).toBe(iframe.contentWindow.document);
    expect(getRootNode(ref.current)).toBe(iframe.contentDocument);
  });

  it('returns the shadow root if the element is in a shadow DOM', () => {
    // Setup shadow DOM
    const hostDiv = document.createElement('div');
    const shadowRoot = hostDiv.attachShadow({mode: 'open'});
    const shadowDiv = document.createElement('div');
    shadowRoot.appendChild(shadowDiv);
    document.body.appendChild(hostDiv);

    expect(getRootNode(shadowDiv)).toBe(shadowRoot);

    // Teardown
    document.body.removeChild(hostDiv);
  });

  it('returns the correct shadow root for nested shadow DOMs', () => {
    // Setup nested shadow DOM
    const outerHostDiv = document.createElement('div');
    const outerShadowRoot = outerHostDiv.attachShadow({mode: 'open'});
    const innerHostDiv = document.createElement('div');
    outerShadowRoot.appendChild(innerHostDiv);
    const innerShadowRoot = innerHostDiv.attachShadow({mode: 'open'});
    const shadowDiv = document.createElement('div');
    innerShadowRoot.appendChild(shadowDiv);
    document.body.appendChild(outerHostDiv);

    expect(getRootNode(shadowDiv)).toBe(innerShadowRoot);

    document.body.removeChild(outerHostDiv);
  });

  it('returns the document for elements directly inside the shadow host', () => {
    const hostDiv = document.createElement('div');
    document.body.appendChild(hostDiv);
    hostDiv.attachShadow({mode: 'open'});
    const directChildDiv = document.createElement('div');
    hostDiv.appendChild(directChildDiv);

    expect(getRootNode(directChildDiv)).toBe(document);

    // Teardown
    document.body.removeChild(hostDiv);
  });

});

describe('getOwnerWindow', () => {
  test.each([null, undefined])('returns the window if the argument is %p', (value) => {
    expect(getOwnerWindow(value)).toBe(window);
  });

  it('returns the window if the element is in the window', () => {
    const div = document.createElement('div');
    window.document.body.appendChild(div);
    expect(getOwnerWindow(div)).toBe(window);
  });

  it('returns the window if the element is the window', () => {
    expect(getOwnerWindow(window)).toBe(window);
  });

  it("returns the iframe's window if the element is in the iframe", () => {
    const iframe = document.createElement('iframe');
    const iframeDiv = document.createElement('div');
    window.document.body.appendChild(iframe);
    iframe.contentWindow.document.body.appendChild(iframeDiv);

    expect(getOwnerWindow(iframeDiv)).toBe(iframe.contentWindow);

    // Teardown
    iframe.remove();
  });
});
