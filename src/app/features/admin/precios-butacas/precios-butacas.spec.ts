import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreciosButacas } from './precios-butacas';

describe('PreciosButacas', () => {
  let component: PreciosButacas;
  let fixture: ComponentFixture<PreciosButacas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreciosButacas],
    }).compileComponents();

    fixture = TestBed.createComponent(PreciosButacas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
