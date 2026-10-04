import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaCombos } from './lista-combos';

describe('ListaCombos', () => {
  let component: ListaCombos;
  let fixture: ComponentFixture<ListaCombos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCombos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaCombos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
