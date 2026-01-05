const variables = [
  {name:'_story_title', value:'Choices Test'},
  {name:'_starting_passage', value:'start'},
  {name:'_current_passage', value:''},
  {name:'_money_format', value:'!$1.2!($1.2)!'},
  {name:'cash', value:423, money:true},
  {name:'hat colour', value:'blue'},
]


const passages = [
  {
    name:'start',
    text:'This is a test game for <i>choices</i>.',
    choice_list:[
      {name:'Option one'},
      {name:'Option 2', text:'Option two'},
    ],
  },

  {
    name:'Option one',
    title:"The End",
    text:'This is option one for <i>choices</i>.<<log Selected portal!>>',
    portal:true,
    choice_list:[
      {name:'end'},
    ],
  },

  {
    name:'Option 2',
    text:'This is option two for <i>choices</i>. It is <<if %90>>yellow.<<else>>blue<</if>>.',
    css_class:'meta',
    choice_list:[
      {name:'start', text:'Back to start'},
    ],
  },

  {
    name:'end',
    title:"The End",
    text:'That\'s All Folks',
    choice_list:[
    ],
  },

]