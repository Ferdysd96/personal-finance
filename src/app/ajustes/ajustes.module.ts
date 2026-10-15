import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AjustesPageRoutingModule } from './ajustes-routing.module';
import { AjustesPage } from './ajustes.page';
@NgModule({ imports: [SharedModule, AjustesPageRoutingModule], declarations: [AjustesPage] })
export class AjustesPageModule {}
