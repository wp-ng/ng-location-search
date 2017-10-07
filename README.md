location-search
=================

Angular Location Search directive.

<h4>Installing</h4>

```
bower install location-search
```

```javascript
angular('yourAngularApp',['locationSerach']);
```

<h4>Usage/Example Form</h4>

```html
<form role="search" novalidate data-ng-submit="$searchFields" name="searchForm" class="search-form" location-search="search" location-search-reset="true">
  <label>Search for</label> 
  <input type="search" data-ng-model="$searchFields.search" class="search-field form-control" placeholder="Search" required>
  <button type="submit" class="btn btn-search-submit"><i class="fa fa-search"></i></button>
</form>
```

<h4>Usage/Example ngModel with ui-select module</h4>

```html
<ui-select data-ng-init="optionsOrderBy.data=[{'name: 'All', 'slug':'{'orderby':null, 'order':null}'},{'name:'Price','slug':'{'orderby': 'price','order':'asc'}'}]" location-search="['orderby', 'order']" data-ng-model="optionsOrderBy.selected" search-enabled="false" theme="bootstrap" >
  <ui-select-match >{{$select.selected.value.name}}</ui-select-match>
  <ui-select-choices position="auto" repeat="option.value.slug as (key, option) in optionsOrderBy.data | filter: { value: { name: $select.search }}">
    <span data-ng-bind-html="option.value.name | highlight: $select.search"></span>
  </ui-select-choices>
</ui-select>
```
