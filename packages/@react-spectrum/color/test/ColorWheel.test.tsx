/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, fireEvent, installMouseEvent, installPointerEvent, render} from '@react-spectrum/test-utils';
import {ColorWheel} from '../';
import {ControlledHSL} from '../stories/ColorWheel.stories';
import {parseColor} from '@react-stately/color';
import React from 'react';
import userEvent from '@testing-library/user-event';

const SIZE = 160;
const CENTER = SIZE / 2;
const THUMB_RADIUS = 68;

const getBoundingClientRect = () => ({
  width: SIZE, height: SIZE,
  x: 0, y: 0,
  top: 0, left: 0,
  bottom: SIZE, right: SIZE,
  toJSON() { return this; }
});

describe('ColorWheel', () => {
  let onChangeSpy = jest.fn();
  let onChangeEndSpy = jest.fn();

  beforeAll(() => {
    jest.spyOn(window.HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => SIZE);
    // @ts-ignore
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
    // @ts-ignore
    jest.useFakeTimers('legacy');
  });

  afterEach(() => {
    // for restoreTextSelection
    jest.runAllTimers();
    onChangeSpy.mockClear();
    onChangeEndSpy.mockClear();
  });

  it('sets input props', () => {
    let {getByRole} = render(<ColorWheel />);
    let slider = getByRole('slider');

    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('aria-label', 'Hue');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '360');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveAttribute('aria-valuetext', '0°');
  });

  it('the slider is focusable', () => {
    let {getAllByRole, getByRole} = render(<div>
      <button>A</button>
      <ColorWheel />
      <button>B</button>
    </div>);
    let slider = getByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');

    userEvent.tab();
    expect(document.activeElement).toBe(buttonA);
    userEvent.tab();
    expect(document.activeElement).toBe(slider);
    userEvent.tab();
    expect(document.activeElement).toBe(buttonB);
    userEvent.tab({shift: true});
    expect(document.activeElement).toBe(slider);
  });

  it('disabled', () => {
    let {getAllByRole, getByRole} = render(<div>
      <button>A</button>
      <ColorWheel isDisabled />
      <button>B</button>
    </div>);
    let slider = getByRole('slider');
    let [buttonA, buttonB] = getAllByRole('button');
    expect(slider).toHaveAttribute('disabled');

    userEvent.tab();
    expect(document.activeElement).toBe(buttonA);
    userEvent.tab();
    expect(document.activeElement).toBe(buttonB);
    userEvent.tab({shift: true});
    expect(document.activeElement).toBe(buttonA);
  });

  describe('labelling', () => {
    it('should support a custom aria-label', () => {
      let {getByRole} = render(<ColorWheel aria-label="Color hue" />);
      let slider = getByRole('slider');

      expect(slider).toHaveAttribute('aria-label', 'Color hue');
      expect(slider).not.toHaveAttribute('aria-labelledby');
    });

    it('should support a custom aria-labelledby', () => {
      let {getByRole} = render(<ColorWheel aria-labelledby="label-id" />);
      let slider = getByRole('slider');

      expect(slider).not.toHaveAttribute('aria-label');
      expect(slider).toHaveAttribute('aria-labelledby', 'label-id');
    });
  });

  describe('keyboard events', () => {
    it('works', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Right'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 1).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
      expect(onChangeEndSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 1).toString('hsla'));
      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
      expect(onChangeEndSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
    });

    it('doesn\'t work when disabled', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} isDisabled />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Right'});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
    });

    it('wraps around', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Left'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 359).toString('hsla'));
    });

    it('respects page steps', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'PageUp'});
      fireEvent.keyUp(slider, {key: 'PageUp'});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 15).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
      expect(onChangeEndSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 15).toString('hsla'));
      fireEvent.keyDown(slider, {key: 'PageDown'});
      fireEvent.keyUp(slider, {key: 'PageDown'});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
      expect(onChangeEndSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
    });

    it('respects page steps from shift arrow', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} />);
      let slider = getByRole('slider');
      act(() => {slider.focus();});

      fireEvent.keyDown(slider, {key: 'Right', shiftKey: true});
      fireEvent.keyUp(slider, {key: 'Right', shiftKey: true});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 15).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
      expect(onChangeEndSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 15).toString('hsla'));
      fireEvent.keyDown(slider, {key: 'Left', shiftKey: true});
      fireEvent.keyUp(slider, {key: 'Left', shiftKey: true});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
      expect(onChangeEndSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 0).toString('hsla'));
    });
  });

  describe.each`
    type                | prepare               | actions
    ${'Mouse Events'}   | ${installMouseEvent}  | ${[
      (el, {pageX, pageY}) => fireEvent.mouseDown(el, {button: 0, pageX, pageY, clientX: pageX, clientY: pageY}),
      (el, {pageX, pageY}) => fireEvent.mouseMove(el, {button: 0, pageX, pageY, clientX: pageX, clientY: pageY}),
      (el, {pageX, pageY}) => fireEvent.mouseUp(el, {button: 0, pageX, pageY, clientX: pageX, clientY: pageY})
    ]}
    ${'Pointer Events'} | ${installPointerEvent}| ${[
      (el, {pageX, pageY}) => fireEvent.pointerDown(el, {button: 0, pointerId: 1, pageX, pageY, clientX: pageX, clientY: pageY}),
      (el, {pageX, pageY}) => fireEvent.pointerMove(el, {button: 0, pointerId: 1, pageX, pageY, clientX: pageX, clientY: pageY}),
      (el, {pageX, pageY}) => fireEvent.pointerUp(el, {button: 0, pointerId: 1, pageX, pageY, clientX: pageX, clientY: pageY})
    ]}
    ${'Touch Events'}   | ${() => {}}           | ${[
      (el, {pageX, pageY}) => fireEvent.touchStart(el, {changedTouches: [{identifier: 1, pageX, pageY, clientX: pageX, clientY: pageY}]}),
      (el, {pageX, pageY}) => fireEvent.touchMove(el, {changedTouches: [{identifier: 1, pageX, pageY, clientX: pageX, clientY: pageY}]}),
      (el, {pageX, pageY}) => fireEvent.touchEnd(el, {changedTouches: [{identifier: 1, pageX, pageY, clientX: pageX, clientY: pageY}]})
    ]}
  `('$type', ({actions: [start, move, end], prepare}) => {
    prepare();

    it('dragging the thumb works', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {container: _container, getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} />);
      let slider = getByRole('slider');
      let thumb = slider.parentElement;
      let container = _container.firstChild.firstChild as HTMLElement;
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(thumb, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(onChangeEndSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).toBe(slider);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 90).toString('hsla'));
      expect(onChangeEndSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).toBe(slider);

      end(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
      expect(onChangeEndSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 90).toString('hsla'));
      expect(document.activeElement).toBe(slider);
    });

    it('dragging the thumb doesn\'t works when disabled', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {container: _container, getByRole} = render(<ColorWheel isDisabled defaultValue={defaultColor} onChange={onChangeSpy} />);
      let slider = getByRole('slider');
      let container = _container.firstChild.firstChild as HTMLElement;
      container.getBoundingClientRect = getBoundingClientRect;
      let thumb = slider.parentElement;

      expect(document.activeElement).not.toBe(slider);
      start(thumb, {pageX: CENTER + THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      move(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      end(thumb, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);
    });

    it('clicking and dragging on the track works', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {container: _container, getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} />);
      let slider = getByRole('slider');
      let thumb = slider.parentElement;
      let container = _container.firstChild.firstChild as HTMLElement;
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 90).toString('hsla'));
      expect(document.activeElement).toBe(slider);

      move(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy.mock.calls[1][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 180).toString('hsla'));
      expect(document.activeElement).toBe(slider);

      end(thumb, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(document.activeElement).toBe(slider);
    });

    it('clicking and dragging on the track doesn\'t work when disabled', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {container: _container, getByRole} = render(<ColorWheel defaultValue={defaultColor} onChange={onChangeSpy} isDisabled />);
      let slider = getByRole('slider');
      let container = _container.firstChild.firstChild as HTMLElement;
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      move(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);

      end(container, {pageX: CENTER - THUMB_RADIUS, pageY: CENTER});
      expect(onChangeSpy).toHaveBeenCalledTimes(0);
      expect(document.activeElement).not.toBe(slider);
    });

    it('clicking on the track works', () => {
      let defaultColor = parseColor('hsl(0, 100%, 50%)');
      let {container: _container, getByRole} = render(<ControlledHSL defaultValue={defaultColor} onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} />);
      let slider = getByRole('slider');
      let container = _container.firstChild.firstChild as HTMLElement;
      container.getBoundingClientRect = getBoundingClientRect;

      expect(document.activeElement).not.toBe(slider);
      start(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy.mock.calls[0][0].toString('hsla')).toBe(defaultColor.withChannelValue('hue', 90).toString('hsla'));
      expect(document.activeElement).toBe(slider);

      end(container, {pageX: CENTER, pageY: CENTER + THUMB_RADIUS});
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(slider);
      expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('thumb background color should not include alpha channel', () => {
    let defaultColor = parseColor('hsla(0, 100%, 50%, 0.5)');
    let {container: _container} = render(<ColorWheel defaultValue={defaultColor} />);
    /*
     Current DOM structure for ColorWheel, starting at the container:

     div
       div.spectrum-ColorWheel
         div.spectrum-ColorWheel-gradient
         div.spectrum-ColorWheel-handle
             div.spectrum-ColorHandle-color
             svg.spectrum-ColorLoupe
               ...
             input.spectrum-ColorWheel-slider
    */
    let handleColorElement = _container.firstChild.firstChild.nextSibling.firstChild as HTMLElement;
    let thumbColor = parseColor(handleColorElement.style.backgroundColor);
    expect(defaultColor.getChannelValue('alpha')).toEqual(0.5);
    expect(thumbColor.getChannelValue('alpha')).toEqual(1);
  });
});
