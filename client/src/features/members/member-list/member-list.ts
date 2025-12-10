import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MemberService } from '../../../core/services/member-service';
import { Member, MemberParams } from '../../../types/member';
import { MemberCard } from '../member-card/member-card';
import { PaginatedResult } from '../../../types/pagination';
import { Paginator } from "../../../shared/paginator/paginator";
import { FilterModal } from '../filter-modal/filter-modal';


@Component({
  selector: 'app-member-list',
  imports: [MemberCard, Paginator, FilterModal],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css'
})
export class MemberList implements OnInit {  
  @ViewChild('filterModal') modal!: FilterModal;
  private memberService = inject(MemberService);
  protected paginatedMembers = signal<PaginatedResult<Member> | null>(null);
  private defaultParams = new MemberParams();
  protected memberParams = new MemberParams();
  private updatedParams = new MemberParams();
  protected filterSummary = signal('No Filters Applied');

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(){
    this.memberService.getMembers(this.memberParams).subscribe(result => {
      this.paginatedMembers.set(result);
    });
  }

  onPageChange(event: {pageNumber: number, pageSize: number}){
    this.memberParams.pageNumber = event.pageNumber;
    this.memberParams.pageSize = event.pageSize;
    this.loadMembers();
  }

  openModal(){
    this.modal.open();
  }

  onCloseModal(){
    // Handle any actions needed when the modal is closed
    console.log('Filter modal closed');
  }

  onFilterSubmit(params: MemberParams){
    this.memberParams = {... params};
    this.updatedParams = {... params};
    this.updateFilterSummary();
    this.loadMembers();
  }

  resetFilters(){
    this.memberParams = new MemberParams();
    this.updatedParams = new MemberParams();
    this.updateFilterSummary();
    this.loadMembers();
  }

  private updateFilterSummary(): void {
    const defaults = new MemberParams();
    const filters: string[] = [];

    if (this.updatedParams.gender) filters.push(`${this.updatedParams.gender}s`);
    if (this.updatedParams.minAge !== defaults.minAge || this.updatedParams.maxAge !== defaults.maxAge) {
      filters.push(`Ages: ${this.updatedParams.minAge}-${this.updatedParams.maxAge}`);
    }
    if (this.updatedParams.orderBy !== defaults.orderBy) {
      filters.push(`Order By: ${this.updatedParams.orderBy}`);
    }

    this.filterSummary.set(filters.length ? filters.join(', ') : 'No Filters Applied');
  }
}
