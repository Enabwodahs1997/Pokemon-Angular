import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { initializeApp } from 'firebase/app';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { environment as baseEnvironment } from '../environments/environment';
import { environment as localEnvironment } from '../environments/environment.local';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

const environment = {
  ...baseEnvironment,
  ...localEnvironment,
  firebase: {
    ...baseEnvironment.firebase,
    ...localEnvironment.firebase
  }
};

@NgModule({
  declarations: [AppComponent, LoginComponent, HomeComponent, RegisterComponent, ProfileComponent],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent, canActivate: [AuthGuard] },
      { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
      { path: 'register', component: RegisterComponent },
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    initializeApp(environment.firebase);
  }
}
