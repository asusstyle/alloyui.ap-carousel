AUI.add('ap-carousel', function(A) {
var Lang = A.Lang,
	APCAROUSEL = 'ap-carousel';

var APCarousel = A.Component.create({
	NAME: 'APCAROUSEL',
	ATTRS: {
		contentBox: {
			value: "carousel"	// Default name to target DOM element, user can override at time of initialisation.
		},
		direction: {
			// If the page's language reads from R-to-L, the HTML tag will have 'dir' attribute with 'rtl' value, other wise default value will be 'ltr'
			value: A.one('html').get('dir') || 'ltr'
		},
		animation: {
			value: "slide"		// OR fade
		},
		animationTime: {
			value: 1			// Animation will happend in specified seconds, Default is 1 sec
		},
		interval: {
			value: 3			// Animation will wait for specified seconds, Default is 3 sec
		},
		looping: {
			value: true			// Default is TRUE for continuous scrolling of the slides, FALSE if you do not want continuous scrolling
		},
		pagination: {
			value: true			// Default is TRUE, To show up the pagination below carousel
		},
		playControls: {
			value: true			// Default is TRUE, but user can set it FALSE to remove the PLAY/PAUSE controls
		},
		autoPlay:{
			value: true			// Default is TRUE, Carousel will start rotation by default
		},
		playLabel: {
			value: 'Play'		// User can change Label of the 'Play'
		},
		pauseLabel: {
			value: 'Pause'		// User can change Label of the 'Pause'
		},
		directionControls: {
			value: true			// Default is TRUE, but user can set it FALSE to remove the DIRECTIONAL controls
		},
		nextLabel: {
			value: 'Next'		// User can change Label of the 'Next'
		},
		prevLabel: {
			value: 'Previous'	// User can change Label of the 'Previous'
		},
		beforeSliding: {
			value: null,
			setter: "setBeforeSliding"
		}/*,
		afterSliding: {
			value: function(){}
		}*/
	},
	prototype: {
		index: 0,						// INDEX of the slide intialised to '0'
		instanceWidth: new Array(),		// Storing WIDTH of each slides in an array
		animInterval: null,				// Declaring variable for slide animation
		totalChildren: 0,				// Storing total number of slides
		
		initializer: function(){
			var _this = this,
				instance = _this.get("contentBox"),
				animation = _this.get("animation"),
				autoPlay = _this.get("autoPlay"),
				dir = _this.get("direction") == "rtl" ? "right" : "left",
				directionControls = _this.get("directionControls"),
				playControls = _this.get("playControls"),
				pagerControls = _this.get("pagination"),
				parent = instance.ancestor(),		// Getting wrapper element of carousel
				carouselControl = A.Node.create("<div class='ap-carousel-controls' />");		// Creating a node for carousel controls
			_this.totalChildren = instance.get("children").size();		// Getting actual children of carousel
			
			carouselControl.appendTo(parent);		// Adding Carousel Control to Carousel Wrapper Div

			// Creating Directional Controls and adding it to Carousel Control Div
			if(directionControls){
				var nextLabel = _this.get("nextLabel"),
					prevLabel = _this.get("prevLabel"),
					_html = "";
				
				_html += "<li class='prev'><span>"+ prevLabel +"</span></li>";
				_html += "<li class='next'><span>"+ nextLabel +"</span></li>";
			
				carouselControl.append("<ul class='directional-controls'>"+ _html +"</ul>");
			}
			
			// Creating Play Controls and adding it to Carousel Control Div
			if(playControls){
				var playLabel = _this.get("playLabel"),
					puaseLabel = _this.get("pauseLabel"),
					_html = "";
				
				_html += "<li class='play'><span>"+ playLabel +"</span></li>";
				_html += "<li class='pause'><span>"+ puaseLabel +"</span></li>";

				carouselControl.append("<ul class='play-controls'>"+ _html +"</ul>");
				if(autoPlay) {
					parent.one(".play-controls li.play").addClass("active");
				} else {
					parent.one(".play-controls li.pause").addClass("active");
				}
			}

			// Creating Pager Controls and adding it to Carousel Control Div
			if(pagerControls){
				var pagination = A.Node.create("<ol class='pagination'></ol>"),
					_html = "";
				
				for(var i=1; i<=_this.totalChildren; i++){
					_html += "<li class='page page"+ i +"'><span>"+ i +"</span></li>";
				}
				carouselControl.append(pagination.html(_html));
			}
			
			// Setting up Carousel according to ANIMATION preference
			if(animation === "fade"){
				_this.setupFader();		// Sets up Carousel for FADE effect
			} else {
				_this.setupSlider();	// Sets up Carousel for SLIDE effect
			}
			
			// Settings to display first slide on intialization of carousel
			if(animation === "fade"){
				instance.get("children").item(0).addClass("current");					// Displaying first slide in FADE animation
			} else {
				instance.setStyle(dir, "-"+ _this.instanceWidth[_this.index] +"px");	// Hiding first slide in SLIDE animation due to cloning
				instance.get("children").item(1).addClass("current");					// Setting the 2nd slide as 1st slide in SLIDE animation
			}
		},
		
		renderUI: function(){
			var _this = this,
				instance = _this.get("contentBox"),
				autoPlay = _this.get("autoPlay");
			
			// Start Animation if autoPlay is TRUE
			if(autoPlay){
				_this.startAnimation();
			} else {
				_this.stopAnimation();
			}
			
			// Initializing all controls
			_this.playPauseControls();
			_this.navigationalControls();
			_this.pagerControls();
			_this.pauseOnMouseOver();
		},
		
		bindUI: function(){ },
		
		setupSlider: function(){		// Setting up the Carousel for SLINDE animation
			var _this = this,
				instance = _this.get("contentBox"),
				direction = _this.get("direction"),
				parent = instance.ancestor(),		// Getting wrapper element of carousel
				tagName = instance.get("children").item(0).get("nodeName").toLowerCase(),		// Getting Element name of the Carousel children
				instanceTotalWidth = 0;
			
			// Floating each children of the Carousel to LEFT or RIGHT according to LANG direction
			(direction === 'rtl')	? parent.all(".aui-apcarousel-content, .aui-apcarousel-content "+ tagName).addClass("pull-right")
									: parent.all(".aui-apcarousel-content, .aui-apcarousel-content "+ tagName).addClass("pull-left");

			// Adding individual classes to each child
			instance.get("children").each(function(node, i){
				node.addClass("child-item"+ ++i);
			});

			// Cloning of First & Last child and appending last-child to first and first-child to last to enable infinite looping of carousel
			var fstClone = instance.get("children").item(0).clone().addClass("ap-clone"),
				lstClone = instance.get("children").item(_this.totalChildren-1).clone().addClass("ap-clone");
			instance.prepend(lstClone).append(fstClone);
			
			// Getting Width of each child from Left and adding it to an Array
			instance.get("children").each(function(node){
				instanceTotalWidth += node.get("offsetWidth");		// Getting total width of the carousel div by adding each child's width
				_this.instanceWidth.push(instanceTotalWidth);		// Pushing each child's width in an Array to use it later in Slide Animation
			});
			instance.setStyle("width", instanceTotalWidth);			// Assigning total width of the Carousel to instance
			
			// Assigning width of the Wrapper element
			parent.setStyles({
				"width": instance.one(tagName).get("offsetWidth"),
				"overflow": "hidden"
			});
		},
		
		startSliding: function (index){
			var _this = this,
				i = index,
				instance = _this.get("contentBox"),
				dir = _this.get("direction") == "rtl" ? "right" : "left",	// Getting direction of the lang/html dir attr and assigning value
				animationTime = _this.get("animationTime"),
				totalChildren = instance.get("children").size();			// Get total number of children of Carousel with two clones
			
			i++;		// Initially i(i.e. INDEX passed in) is set to '0' so increasing to +1 each time to slide to next one
			//_this.setBeforeSliding();
			if(dir == "rtl") {		// If language direction is 'rtl'	(i.e. <html dir='rtl'....>)
				
				instance.transition({		// Sliding a child to the right side with transition in 1 sec.
					"right": (i < 0) ? 0 : "-"+ _this.instanceWidth[i] +"px",
					"duration": animationTime
				}, function(){
					if(i < 0){				// If i is less then 0 then initialising it's value to 3 less then total number of children
						i = totalChildren-3;
					} else if(i == (totalChildren-2)) {	// If i is grt then total children then initialising it's value to 0, so the loop continues
						i = 0;
					}
					// When 'i' is less then '0' we are moving the carousel itself to the right=0 after last child of the carousel completes it's transition, after that adding the 'current' class on the slide
					instance.setStyle("right", "-"+ _this.instanceWidth[i] +"px");
					instance.get("children").removeClass("current");
					instance.get("children").item(i+1).addClass("current");
				});
				
			} else {	// If language direction is 'ltr' (i.e. <html dir='ltr'....>) / even if it's not specified by default it's LTR
				
				instance.transition({		// Sliding a child to the left side with transition in 1 sec.
					"left": (i < 0) ? 0 : "-"+ _this.instanceWidth[i] +"px",
					"duration": animationTime
				}, function(){
					if(i < 0){				// If i is less then 0 then initialising it's value to 3 less then total number of children
						i = totalChildren-3;
					} else if(i == (totalChildren-2)) {// If i 1 sort of total children then initialising it's value to 0, so the loop continues
						i = 0;
					}
					// When 'i' is less then '0' we are moving the carousel itself to the left=0 after last child of the carousel completes it's transition, after that adding the 'current' class on current slide
					instance.setStyle("left", "-"+ _this.instanceWidth[i] +"px");
					instance.get("children").removeClass("current");
					instance.get("children").item(i+1).addClass("current");
				});
				
			}
			
			if(i == (totalChildren-2)){				// If i 1 sort of total children
				_this.index = 0;						// Initialising this.index to 0, so the loop continues
			} else if(i < 0){						// If i is less then 0 then initialising it's value to 3 less then total number of children
				_this.index = totalChildren-3;		// Initialising this.index to 0, so the loop continues
			} else {								// In every other case
				_this.index = i;						// Initialise this.index to the current value of 'i'
			}
		},

		setupFader: function(){
			var _this = this,
				instance = _this.get("contentBox"),
				parent = instance.ancestor(),		// Getting wrapper element of carousel
				tagName = instance.get("children").item(0).get("nodeName").toLowerCase(),		// Getting Element name of the Carousel children
				childHeight = instance.get("children").item(0).get("offsetHeight");			// Getting height of the child element

			
			// Adding class for Fade Effect and setting height of the Carousel Wrapper to child's height
			parent.all(".aui-apcarousel-content "+ tagName).addClass("fade");
			parent.one(".aui-apcarousel-content").setStyle("min-height", childHeight);
			
			// Adding individual classes to each child
			instance.get("children").each(function(node, i){
				node.addClass("child-item"+ ++i);
			});
		},
		
		startFading: function(index){
			var _this = this,
				i = index,
				instance = _this.get("contentBox"),
				animationTime = _this.get("animationTime"),
				totalChildren = instance.get("children").size();			// Get total number of children of Carousel with two clones
			
			var childrens = instance.get("children").size();
			
			i = (i == childrens) ? 0 : i;
			instance.get("children").item(i+1).setStyle("z-index", "0");
			
			while(i < childrens){
				instance.get("children").item(i).transition({
					"opacity":0,
					"duration": animationTime
				}, function(){
					instance.get("children").item(i).setStyle("opacity", "1");
				});
				instance.get("children").item(i+1).setStyle("z-index", "0");
				instance.get("children").removeClass("current");
				instance.get("children").item(i+1).addClass("current");
				//i++;
				
				_this.index  = (i == childrens) ? 0 : i++;
			}
		},
		
		startAnimation: function(){
			var _this = this,
				animation = _this.get("animation"),
				interval = _this.get("interval");
			
			interval = Math.round(interval) * 1000;		// Multipling interval with 1000 to get it in miliseconds
			
			if(animation === "fade"){		// If Animation is FADE
				_this.animInterval = setInterval(function(){_this.startFading(_this.index);}, interval);
			} else {		// Default Animation is SLIDE
				_this.animInterval = setInterval(function(){_this.startSliding(_this.index);}, interval);
			}
		},
		
		stopAnimation: function(){
			var _this = this;
			
			clearInterval(_this.animInterval);		// Clearing interval of animation to stop it
		},
		
		navigationalControls: function(){
			var _this = this,
				instance = _this.get("contentBox"),
				animation = _this.get("animation"),
				parentWrapper = instance.ancestor().ancestor();
			
			parentWrapper.delegate("click", function(){
				_this.index -= 2;
				_this.reInitialize();
				
				parentWrapper.all(".play-controls li").removeClass("active");
				parentWrapper.one(".play-controls li.pause").addClass("active");
					
			}, ".directional-controls li.prev");

			parentWrapper.delegate("click", function(){
				_this.reInitialize();
				
				parentWrapper.all(".play-controls li").removeClass("active");
				parentWrapper.one(".play-controls li.pause").addClass("active");
				
			}, ".directional-controls li.next");
		},
		
		playPauseControls: function(){
			var _this = this,
				instance = _this.get("contentBox"),
				parentWrapper = instance.ancestor().ancestor();
			
			parentWrapper.delegate("click", function(){
				_this.startAnimation();
				
				parentWrapper.all(".play-controls li").removeClass("active");
				this.addClass("active");
				
			}, ".play-controls li.play");
			
			parentWrapper.delegate("click", function(){
				_this.stopAnimation();
				
				parentWrapper.all(".play-controls li").removeClass("active");
				this.addClass("active");
				
			}, ".play-controls li.pause");
		},
		
		pagerControls: function(){
			var _this = this,
				instance = _this.get("contentBox"),
				parentWrapper = instance.ancestor().ancestor(),
				totalPage = parentWrapper.one("ol.pagination").get("children");

			parentWrapper.delegate("click", function(){
				_this.index = totalPage.indexOf(this) - 1;
				console.log(totalPage.indexOf(this));
				_this.reInitialize();
				
				parentWrapper.all(".play-controls li").removeClass("active");
				parentWrapper.one(".play-controls li.pause").addClass("active");
				
			}, ".pagination li");
		},
		
		pauseOnMouseOver: function(){
			var _this = this,
				isPause = false,
				instance = _this.get("contentBox"),
				parentWrapper = instance.ancestor().ancestor(),
				tagName = instance.get("children").item(0).get("nodeName").toLowerCase();
		},
		
		setBeforeSliding: function(){
			var _this = this,
				_index = _this.index;
			
			alert(_this);
		},
		
		afterSlideChange: function(){
		},
		
		reInitialize: function(){
			var _this = this,
				animation = _this.get("animation");
			
			_this.stopAnimation();
			animation === "fade" ? _this.startFading(_this.index) : _this.startSliding(_this.index);
		},
		
		destroy: function(){
			
		}
	}
});

A.APCarousel = APCarousel;

}, '1.5.1' ,{skinnable:true, requires:['aui-base','transition']});