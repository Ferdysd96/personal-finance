import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadChildren: () =>
          import('../inicio/inicio.module').then((m) => m.InicioPageModule),
      },
      {
        path: 'movimientos',
        loadChildren: () =>
          import('../movimientos/movimientos.module').then(
            (m) => m.MovimientosPageModule
          ),
      },
      {
        path: 'categorias',
        loadChildren: () =>
          import('../categorias/categorias.module').then(
            (m) => m.CategoriasPageModule
          ),
      },
      {
        path: 'ajustes',
        loadChildren: () =>
          import('../ajustes/ajustes.module').then((m) => m.AjustesPageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/inicio',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
