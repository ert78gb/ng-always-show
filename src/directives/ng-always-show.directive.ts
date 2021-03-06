import { AfterViewChecked, Directive, ElementRef, HostListener, Inject, Renderer2, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { convertNumberToPx, convertPxToNumber, extractElementPosition } from 'ng-html-util';

@Directive({
  selector: '[always-show]'
})
/**
 * The component is always visible on page if scrolling.
 */
export class AlwaysShowDirective implements AfterViewChecked {
  private _navIsFixed: boolean = false;
  private _top: number | null = null;
  private _edgePanelTop: number;
  private _glue: number | null = null;
  private _placeHolderElementId: string;

  // TODO: Change the any type to Document when fix https://github.com/angular/angular/issues/15640
  constructor(@Inject(DOCUMENT) private _document: any,
              private _el: ElementRef,
              private _renderer: Renderer2) {
  }

  ngAfterViewChecked(): void {
    this._calculateTop();
    this._moveElement();
  }

  /**
   * Component is scrolling until to the top of this component.top upper then edgeComponent.top.
   * Use css selector syntax.
   */
  @Input() edgeElement: string;

  /**
   * The distance from the document.top.
   * @default 25
   */
  @Input() topOffset: number = 25;
  @Input() addPlaceholder = true;
  @Input() zindex = 1031;

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this._moveElement();
  }

  @HostListener("window:resize", [])
  onWindowResize() {
    this._allignToParentWidth();
    this._calculateTop();
    this._moveElement();
  }

  /**
   * Set the style.width with the actual component width;
   */
  private _allignToParentWidth() {
    this._renderer.setStyle(this._el.nativeElement, "width", this._getCalculateWidth());
  }

  /**
   * Return a new calculated with of the component. It is equal parent.width - glue.
   */
  private _getCalculateWidth(): string {
    return convertNumberToPx(this._getParentWidth() - this._getGlue());
  }

  /**
   * The difference between parent.width and component with. We store it,
   * if resize the window and the component is floating, recalculate to the new width.
   */
  private _getGlue() {
    if (this._glue !== null)
      return this._glue;

    const calculatedWidth = convertPxToNumber(this._document.defaultView.getComputedStyle(this._el.nativeElement).width);
    const parentWidth = this._getParentWidth();
    this._glue = parentWidth - calculatedWidth;

    return this._glue;
  }

  /**
   * Return the calculated width of the parent component
   */
  private _getParentWidth(): number {
    return convertPxToNumber(this._document.defaultView.getComputedStyle(this._el.nativeElement.parentElement).width);
  }

  private _calculateTop() {
    let pos = extractElementPosition(this._document, this._el.nativeElement.parentElement);
    this._top = pos.top - this.topOffset;

    if (this.edgeElement) {
      let edgePanel = this._document.querySelector(this.edgeElement);
      let edgePanelPos = extractElementPosition(this._document, <HTMLButtonElement>edgePanel);
      this._edgePanelTop = edgePanelPos.top - this.topOffset;
    }
  }

  /**
   * Calculate the new position if the element.
   */
  private _moveElement() {
    if (this._top === null) {
      return;
    }

    let scrollPos = this._document.body.scrollTop || this._document.documentElement.scrollTop;

    if (!this._navIsFixed && scrollPos > this._top &&
      (!this.edgeElement || this._edgePanelTop > scrollPos)) {

      this._navIsFixed = true;
      this._allignToParentWidth();
      this._el.nativeElement.style.position = 'fixed';
      this._el.nativeElement.style.top = convertNumberToPx(this.topOffset);
      this._el.nativeElement.style.zIndex = this.zindex;
      this.addPlaceholderElement();
    }
    else if (this._navIsFixed && scrollPos < this._top &&
      (!this.edgeElement || scrollPos < this._edgePanelTop)) {
      this._navIsFixed = false;
      this._el.nativeElement.style.position = 'static';
      this._el.nativeElement.style.top = '';
      this._el.nativeElement.style.width = '';
      this.removePlaceholderElement();
    }
    else if (this.edgeElement && scrollPos > this._edgePanelTop) {
      this._el.nativeElement.style.position = 'absolute';
      this._el.nativeElement.style.top = convertNumberToPx(this._edgePanelTop - this._top);
      this._navIsFixed = false;
    }
  }

  private addPlaceholderElement(): void {
    if (!this.addPlaceholder)
      return;

    const document: Document = this._document;
    const elementHeight = this._document.defaultView.getComputedStyle(this._el.nativeElement).height;
    this._placeHolderElementId = 'always-show-placeholder' + Date.now() + Math.floor(Math.random() * 1000);

    const div = document.createElement('div');
    div.id = this._placeHolderElementId;
    div.style.height = elementHeight;
    this._el.nativeElement.parentElement.insertBefore(div, this._el.nativeElement);
  }

  private removePlaceholderElement(): void {
    if (!this._placeHolderElementId)
      return;

    const div = this._document.getElementById(this._placeHolderElementId);
    if (!div)
      return;

    if(div.remove)
      div.remove();
    else
      this._el.nativeElement.parentElement.removeChild(div);
  }
}
