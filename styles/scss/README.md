# Breakpoint Mixin Reference

## Breakpoints

Defined in `_variables.scss`. Values match Bootstrap 5.

```scss
$bp-sm: 576px;
$bp-md: 768px;
$bp-lg: 992px;
$bp-xl: 1200px;
$bp-xxl: 1400px;
```

## Signature

```scss
@include bp($breakpoint, $direction);
```

`$direction` accepts `up` (default), `down`, or `only`.

## Exclusively this breakpoint (only)

```scss
.foo {
  @include bp(xs, only)  { color: red;    } // < 576px
  @include bp(sm, only)  { color: orange; } // 576–767px
  @include bp(md, only)  { color: yellow; } // 768–991px
  @include bp(lg, only)  { color: green;  } // 992–1199px
  @include bp(xl, only)  { color: blue;   } // 1200–1399px
  @include bp(xxl, only) { color: purple; } // ≥ 1400px
}
```

## This and above (min-width)

`up` is the default direction, so it can be omitted.

```scss
.foo {
  @include bp(sm)  { ... } // ≥ 576px
  @include bp(md)  { ... } // ≥ 768px
  @include bp(lg)  { ... } // ≥ 992px
  @include bp(xl)  { ... } // ≥ 1200px
  @include bp(xxl) { ... } // ≥ 1400px
}
```

## This and below (max-width)

```scss
.foo {
  @include bp(sm, down)  { ... } // < 576px
  @include bp(md, down)  { ... } // < 768px
  @include bp(lg, down)  { ... } // < 992px
  @include bp(xl, down)  { ... } // < 1200px
  @include bp(xxl, down) { ... } // < 1400px
}
```

`down` subtracts 1px so it doesn't overlap the corresponding `up` query at
the exact breakpoint value.
