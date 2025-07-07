import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LideresPage } from './lideres.page';

describe('LideresPage', () => {
  let component: LideresPage;
  let fixture: ComponentFixture<LideresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LideresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
