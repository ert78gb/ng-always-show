import {NgModule} from '@angular/core';

import {AlwaysShowDirective} from './directives/ng-always-show.directive';

export * from './directives/ng-always-show.directive';

@NgModule({
  declarations: [AlwaysShowDirective],
  exports: [AlwaysShowDirective]
})
export class AlwaysShowModule {
}
