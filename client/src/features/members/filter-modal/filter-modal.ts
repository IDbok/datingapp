import { Component, ElementRef, output, ViewChild } from '@angular/core';
import { Member, MemberParams } from '../../../types/member';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-modal',
  imports: [FormsModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css'
})
export class FilterModal {
  @ViewChild('filterModal') modalRef!: ElementRef<HTMLDialogElement>;
  closeModal = output();
  submitData = output<MemberParams>();
  memberParams: MemberParams = new MemberParams();

  constructor() {
    this.refreshFilters();
  }

  open(){
    this.modalRef.nativeElement.showModal();
  }

  close(){
    this.modalRef.nativeElement.close();
    this.closeModal.emit();
  }

  submit(){
    this.submitData.emit(this.memberParams);
    this.close();
  }

  public refreshFilters(){
    const savedFilters = localStorage.getItem('filters');
    if (savedFilters) {
      this.memberParams = JSON.parse(savedFilters);     
    }
    else{
      this.memberParams = new MemberParams();
    }
  }

  onMinAgeChange(){
    if (this.memberParams.minAge < 18) this.memberParams.minAge = 18;
  }

  onMaxAgeChange(){
    if (this.memberParams.maxAge < this.memberParams.minAge) {
      this.memberParams.maxAge = this.memberParams.minAge;
    }
  }
}
