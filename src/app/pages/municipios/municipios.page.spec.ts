import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MunicipiosPage } from './municipios.page';

describe('MunicipiosPage', () => {
  let component: MunicipiosPage;
  let fixture: ComponentFixture<MunicipiosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MunicipiosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
