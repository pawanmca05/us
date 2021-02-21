import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {CreateEmployeeComponent} from './employee/create-employee.component';
import {ListEmployeesComponent} from './employee/list-employees.component';
import { Routes, RouterModule } from '@angular/router';
import { CompanyProfileComponent } from './USstock/company-profile.component';

const appRoutes:Routes=[
  {path:'',redirectTo:'/list',pathMatch:'full'},
  {path:'create',component:CreateEmployeeComponent},
  {path:'list', component:ListEmployeesComponent},
  {path:'Us-Stock', component:CompanyProfileComponent}
]

@NgModule({
  declarations: [
    // CreateEmployeeComponent,
    // ListEmployeesComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    CommonModule
  ],
  exports:[RouterModule]
})
export class AppRoutingModule { }
