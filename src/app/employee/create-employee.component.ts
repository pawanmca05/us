import { Component, OnInit } from '@angular/core';
import {FormGroup,FormControl, AbstractControl, FormBuilder, Validators,FormArray} from '@angular/forms';
import {CustomValidators} from '../shared/custom.validators';

@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent implements OnInit {

  employeeForm:FormGroup;

  // This object will hold the messages to be displayed to the user
// Notice, each key in this object has the same name as the
// corresponding form control
formErrors = {
  'fullName': '',
  'email': '',
  'confirmEmail': '',
  'emailGroup': '',
  'phone':'',
  'skillName': '',
  'experienceInYears': '',
  'proficiency': ''
};

// This object contains all the validation messages for this form
validationMessages = {
  'fullName': {
    'required': 'Full Name is required.',
    'minlength': 'Full Name must be greater than 2 characters.',
    'maxlength': 'Full Name must be less than 10 characters.'
  },
  'email': {
    'required': 'Email is required.',
    'emailDomain':'Email Domain should be dell.com.'
  },
  'confirmEmail': {
    'required': 'Confirm Email is required.'
  },
  'emailGroup': {
    'emailMismatch': 'Email and Confirm Email do not match.'
  },
  'phone': {
    'required': 'Phone is required.'
  },
  'skillName': {
    'required': 'Skill Name is required.',
  },
  'experienceInYears': {
    'required': 'Experience is required.',
  },
  'proficiency': {
    'required': 'Proficiency is required.',
  },
};

  constructor(private fb:FormBuilder) { }

  ngOnInit(): void {
    this.employeeForm=this.fb.group({
      fullName:['',[Validators.required,Validators.minLength(2),Validators.maxLength(10)]],
      contactPreference: ['email'],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, CustomValidators.emailDomain('dell.com')]],
        confirmEmail: ['', [Validators.required]],
      }, { validator: matchEmails }),
      phone:[''],
      //Create Skills FormGroup
      skills: this.fb.array([
        this.addSkillFormGroup()
      ])
    });

    

    // When any of the form control value in employee form changes
    // our validation function logValidationErrors() is called
    this.employeeForm.valueChanges.subscribe((data) => {
      this.logValidationErrors(this.employeeForm);
    });
    this.employeeForm.get('contactPreference')
                 .valueChanges.subscribe((data: string) => {
  this.onContactPrefernceChange(data);
});
  }

  addSkillFormGroup(): FormGroup {
    return this.fb.group({
      skillName: ['', Validators.required],
      experienceInYears: ['', Validators.required],
      proficiency: ['', Validators.required]
    });
  }
  onSubmit(): void {
    console.log(this.employeeForm);
  }


  logValidationErrors(group: FormGroup = this.employeeForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);
      this.formErrors[key] = '';
      // Loop through nested form groups and form controls to check
      // for validation errors. For the form groups and form controls
      // that have failed validation, retrieve the corresponding
      // validation message from validationMessages object and store
      // it in the formErrors object. The UI binds to the formErrors
      // object properties to display the validation errors.
      if (abstractControl && !abstractControl.valid
        && (abstractControl.touched || abstractControl.dirty)) {
        const messages = this.validationMessages[key];
        for (const errorKey in abstractControl.errors) {
          if (errorKey) {
            this.formErrors[key] += messages[errorKey] + ' ';
          }
        }
      }
  
      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl);
      }
   // We need this additional check to get to the FormGroup
    // in the FormArray and then recursively call this
    // logValidationErrors() method to fix the broken validation
    if (abstractControl instanceof FormArray) {
      for (const control of abstractControl.controls) {
        if (control instanceof FormGroup) {
          this.logValidationErrors(control);
        }
      }
    }
  });
  }
  onLoadDataClick(): void {
    this.logValidationErrors(this.employeeForm);
    console.log(this.formErrors);
  }
// If the Selected Radio Button value is "phone", then add the
// required validator function otherwise remove it
onContactPrefernceChange(selectedValue: string) {
  const phoneFormControl = this.employeeForm.get('phone');
  if (selectedValue === 'phone') {
    phoneFormControl.setValidators(Validators.required);
  } else {
    phoneFormControl.clearValidators();
  }
  phoneFormControl.updateValueAndValidity();
}
addSkillButtonClick(): void {
  (<FormArray>this.employeeForm.get('skills')).push(this.addSkillFormGroup());
}

}
function matchEmails(group: AbstractControl): { [key: string]: any } | null {
  
  const emailControl = group.get('email');
  const confirmEmailControl = group.get('confirmEmail');

  if (emailControl.value === confirmEmailControl.value || confirmEmailControl.pristine) {
    return null;
  } else {
    return { 'emailMismatch': true };
  }
}