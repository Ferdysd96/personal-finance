import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/inicio',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then((m) => m.TabsPageModule),
  },
  {
    path: 'detalle/:id',
    loadChildren: () =>
      import('./detalle/detalle.module').then((m) => m.DetallePageModule),
  },
  {
    path: 'ingreso-manual',
    loadChildren: () =>
      import('./ingreso-manual/ingreso-manual.module').then(
        (m) => m.IngresoManualPageModule
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}