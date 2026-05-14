import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const WritePost = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background font-body-md flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop flex flex-col xl:flex-row gap-gutter">
        {/* Content Creation Area */}
        <div className="flex-1 space-y-gutter">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="bg-surface border-2 border-on-background p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Write a Post</h2>
          </div>
          
          {/* Editor Surface */}
          <div className="bg-white border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* Title Input Area */}
            <div className="p-6 border-b-2 border-on-background">
              <input className="w-full font-headline-md text-headline-md border-none focus:ring-0 placeholder:text-on-surface-variant/30" placeholder="Enter your post title..." type="text"/>
            </div>
            
            {/* Rich Text Toolbar */}
            <div className="bg-surface-container flex flex-wrap items-center gap-2 p-3 border-b-2 border-on-background">
              <div className="flex gap-1 pr-4 border-r-2 border-on-background/10">
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">format_bold</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">format_italic</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">format_underlined</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">strikethrough_s</span></button>
              </div>
              <div className="flex gap-1 px-4 border-r-2 border-on-background/10">
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">format_list_bulleted</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">format_list_numbered</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">format_quote</span></button>
              </div>
              <div className="flex gap-1 px-4 border-r-2 border-on-background/10">
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">link</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">image</span></button>
                <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">code</span></button>
              </div>
              <div className="flex-1"></div>
              <button className="p-2 hover:bg-secondary-container/20 rounded-md transition-colors"><span className="material-symbols-outlined">help_outline</span></button>
            </div>
            
            {/* Main Writing Area */}
            <textarea className="w-full min-h-[500px] p-8 font-body-lg text-body-lg border-none focus:ring-0 resize-none leading-relaxed" placeholder="Start sharing your knowledge here..."></textarea>
          </div>
        </div>

        {/* Right Sidebar (Post Settings) */}
        <aside className="w-full xl:w-80 space-y-gutter">
          {/* Publishing Actions */}
          <div className="bg-white border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Publish</h3>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-secondary-container text-on-secondary-container border-2 border-on-background py-3 font-label-bold rounded-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all">
                <span className="material-symbols-outlined">save</span>
                Save Draft
              </button>
              <button className="w-full bg-primary-container text-on-primary-container border-2 border-on-background py-3 font-label-bold rounded-lg flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all">
                <span className="material-symbols-outlined">send</span>
                Publish Post
              </button>
            </div>
          </div>

          {/* Post Settings Card */}
          <div className="bg-white border-2 border-on-background rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-4 border-b-2 border-on-background bg-secondary-fixed">
              <h3 className="font-label-bold text-label-bold uppercase tracking-wider text-on-secondary-fixed">Post Settings</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="font-label-bold text-label-bold text-on-surface">Category</label>
                <div className="relative">
                  <select className="w-full bg-surface border-2 border-on-background rounded-lg py-2 px-3 appearance-none focus:ring-2 focus:ring-primary-container">
                    <option>Study Tips</option>
                    <option>Technology</option>
                    <option>Career</option>
                    <option>Research</option>
                    <option>Campus Life</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </div>
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <label className="font-label-bold text-label-bold text-on-surface">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-tertiary-container text-on-tertiary-container border-2 border-on-background px-2 py-1 rounded-full text-xs font-label-bold flex items-center gap-1">
                    #productivity
                    <span className="material-symbols-outlined text-sm cursor-pointer">close</span>
                  </span>
                  <span className="bg-secondary-fixed-dim text-on-secondary-fixed-variant border-2 border-on-background px-2 py-1 rounded-full text-xs font-label-bold flex items-center gap-1">
                    #learning
                    <span className="material-symbols-outlined text-sm cursor-pointer">close</span>
                  </span>
                </div>
                <input className="w-full bg-surface border-2 border-on-background rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-container" placeholder="Add a tag..." type="text"/>
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <label className="font-label-bold text-label-bold text-on-surface">Featured Image</label>
                <div className="aspect-video bg-surface-container-low border-2 border-dashed border-on-background rounded-lg flex flex-col items-center justify-center text-on-surface-variant cursor-pointer hover:bg-surface-container transition-colors p-4">
                  <span className="material-symbols-outlined text-4xl mb-2">upload_file</span>
                  <span className="font-label-bold text-xs text-center">Click to upload or drag and drop</span>
                  <span className="text-[10px] mt-1 opacity-60">PNG, JPG up to 10MB</span>
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-2 pt-4 border-t-2 border-on-background/5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input defaultChecked className="sr-only peer" type="checkbox"/>
                    <div className="w-10 h-6 bg-surface-variant border-2 border-on-background rounded-full peer-checked:bg-primary-container transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-on-background rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                  <span className="font-label-bold text-label-bold">Public Post</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input className="sr-only peer" type="checkbox"/>
                    <div className="w-10 h-6 bg-surface-variant border-2 border-on-background rounded-full peer-checked:bg-primary-container transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-on-background rounded-full transition-transform peer-checked:translate-x-4"></div>
                  </div>
                  <span className="font-label-bold text-label-bold">Allow Comments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Writing Tips Card */}
          <div className="bg-primary-container/10 border-2 border-on-background border-dashed rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              <h4 className="font-label-bold text-label-bold text-primary">Pro Tip</h4>
            </div>
            <p className="text-sm font-body-md text-on-surface-variant leading-relaxed">
              Start with a strong "How-To" or "Why" to grab your reader's attention. Educational posts perform 40% better when they include bulleted lists and clear subheadings.
            </p>
          </div>
        </aside>
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-on-background px-4 py-3 z-50 flex justify-around">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-label-bold">Dashboard</span>
        </NavLink>
        <button className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-[10px] font-label-bold">Library</span>
        </button>
        <NavLink to="/blog" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">article</span>
          <span className="text-[10px] font-label-bold">Blog</span>
        </NavLink>
        <button className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-label-bold">Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default WritePost;
