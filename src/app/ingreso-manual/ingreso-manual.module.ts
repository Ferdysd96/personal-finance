import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { IngresoManualPageRoutingModule } from './ingreso-manual-routing.module';
import { IngresoManualPage } from './ingreso-manual.page';

@NgModule({
  imports: [SharedModule, IngresoManualPageRoutingModule],
  declarations: [IngresoManualPage],
})
export class IngresoManualPageModule {}
