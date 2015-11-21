# web2spa

JavaScript module for web2py ( www.web2py.com ) framework that helps to build a single-page-application.
It uses:
---  my own router based on a HTML5 History API
---  templating system based on John Resig code ( http://ejohn.org/blog/javascript-micro-templating/ )
---  login/logout handling, errors handling
---  ajax load helper,
---  form setup and inputs scan functions, form verification with UUID
---  String prototype extensions
---  internalization

Module named web2spa.js, it performs all the magic and must be linked as:
<script src="{{=URL('static','js/web2spa.js')}}"></script>
