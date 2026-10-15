import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetallePage } from './detalle.page';
const routes: Routes = [{ path: '', component: DetallePage }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class DetallePageRoutingModule {}
