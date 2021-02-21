import { Component, OnInit } from '@angular/core';
import {CompanyProfileService} from '../services/company-profile.service';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-company-profile',
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.css']
})
export class CompanyProfileComponent implements OnInit {

    userData: any[] = [];
    profile: any;
    keyword = 'Name';
    isProfile:boolean=false;

  constructor(private _companyProfileService:CompanyProfileService) { }
  myControl = new FormControl();
  options: any[];
  ngOnInit(): void {
    this._companyProfileService.getCompanyProfile('').subscribe(data=>this.profile=data);
    this._companyProfileService.getCompanyList().subscribe(
      data => {
        this.options=data.slice(0,10);
      },
      error => {
        console.log("Something wrong here");
      });
  }

  
   selectEvent(item) {
     this.isProfile=false;
    // do something with selected item
    this._companyProfileService.getCompanyProfile(item.Code).subscribe(
      data=>{this.profile=data
        if(data!=null||data==undefined)
        {
          this.isProfile=true;
        }
        for(var key in this.profile) {
          
          if(key=="52WeekHigh"){
            this.profile.WeekHigh52=this.profile[key];
          }
          if(key=="52WeekLow"){
            this.profile.WeekLow52=this.profile[key];
          }
          if(key=="50DayMovingAverage"){
            this.profile.DayMovingAverage50=this.profile[key];
          }
          if(key=="200DayMovingAverage"){
            this.profile.DayMovingAverage200=this.profile[key];
          }
        }
      
      });
    
    
  }

  onChangeSearch(val: string) {
    // fetch remote data from here
    // And reassign the 'data' which is binded to 'data' property.
    if(val.length>=3){
      this._companyProfileService.getCompanyList().subscribe(
        data => {
          this.options=data.filter(d=>d.Name.toLowerCase().includes(val.toLowerCase()));
          
        },
        error => {
          console.log("Something wrong here");
        });
    }
    
  }
  
  onFocused(e){
    // do something when input is focused
  }

}
