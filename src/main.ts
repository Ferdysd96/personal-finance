import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  swapHorizontalOutline,
  pieChartOutline,
  settingsOutline,
  optionsOutline,
  arrowDownOutline,
  arrowUpOutline,
  refreshOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';

import { AppModule } from './app/app.module';

addIcons({
  'home-outline': homeOutline,
  'swap-horizontal-outline': swapHorizontalOutline,
  'pie-chart-outline': pieChartOutline,
  'settings-outline': settingsOutline,
  'options-outline': optionsOutline,
  'arrow-down-outline': arrowDownOutline,
  'arrow-up-outline': arrowUpOutline,
  'refresh-outline': refreshOutline,
  'add-outline': addOutline,
  'trash-outline': trashOutline,
});

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));