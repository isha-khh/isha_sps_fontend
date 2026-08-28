using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Collections;
using ez;

public partial class admin_language_reg : ez.admin.PageBase
{

    public language language = new language();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            if (!loginInfo.isLoginDesginMode) { addRootPanel.Visible = false; }

            language.Load();
            language.InitOptions(nation, nationPanel);
                                      

            BuildTreeView();
       
            //展開項目
            if (!isStrNull(Request["code"]))
            {
                formPanel.Visible = true;
                formPanel.Enabled = true;

                //載入資料                 
                if (language.Load(ValString(Request["code"])))
                {
                    mode.Value = "edit";

                    language.DataInfo info = language.Data;
                    code.Value = info.Code;
                    code.Disabled = true;
                    lang_name.Value = info.Lang_Name;
                    country.Value = info.Country;
                    url.Value = info.Url;
                    other_codes.Value = info.other_codes;


                    if (loginInfo.isLoginDesginMode) { del.Visible = true; }

                    nationPanel.Visible = false;   
                }
                else
                {
                    msg.Text = language.log;
                    formPanel.Enabled = false;
                    nationPanel.Visible = true;
                }

                
            }
        }
       
    }
       

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        TreeView1.Nodes.Clear();
        BuildChild(TreeView1.Nodes);
          
    }

    public void BuildChild(TreeNodeCollection Nodes)
    {

        ArrayList Rows = language.RowData();
  
           
        foreach (language.DataInfo info in Rows)
        {

            TreeNode newNode = new TreeNode();
          
            if (ValString(Request["code"]) == info.Code)
            {
                newNode.Text = "<b><span style=\"color:blue\">" + info.Lang_Name + "</span></b>";           
            }
            else
            {
                newNode.Text = info.Lang_Name;
            } 
            newNode.Value = info.Code;
            newNode.NavigateUrl = Request.Url.AbsolutePath + "?code=" + info.Code;
            newNode.Expand();
            Nodes.Add(newNode);     
          
        }


    }

    #endregion
    
  
    #region 表單預設

    void defForm()
    {
        code.Disabled = false;
        code.Value = "";
        lang_name.Value = "";
        country.Value = "";
        url.Value = "";       
        mode.Value = "";
        msg.Text = "";    
        del.Visible = false;    
    }

    #endregion

    #region 建立選項

    protected void addRootOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        formPanel.Visible = true;        
        mode.Value = "addRoot";
        Literal1.Text = "建立語系";
        navDiv.Visible = true;
        submitButton.Visible = true;
        nationPanel.Visible = true;
    }
     
    #endregion
    
    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            language.DataInfo info = new language.DataInfo();
                     
            info.Code = code.Value.Trim();
            info.Lang_Name = lang_name.Value.Trim();
            info.Country = country.Value.Trim();
            info.Url = url.Value.Trim();
            info.other_codes = other_codes.Value.Trim();

            language.Data = info;
            
            if (mode.Value == "addRoot")
            {           
                if (language.Add()) 
                { 
                    msg.Text = "新增成功"; 
                    BuildTreeView();
                    if (!isStrNull(nation.SelectedValue))
                    {
                        if (language.TemplateCopy(nation.SelectedValue, info.Code))
                        {
                           
                        }
                        else
                        {
                            msg.Text += "<br>錯誤：" + language.log; 
                        }
                    }
                }
                else { msg.Text = language.log; }
            }          
            else if (mode.Value == "edit")
            {
                if (language.Edit())
                {
                    msg.Text = "修改成功"; 
                    BuildTreeView();                  
                }
                else { msg.Text = language.log; }
            }

            if (msg.Text.IndexOf("成功") > -1)
            {
                ScriptJS("msgtop('" + Server.HtmlEncode(msg.Text) + "','success')");
                msg.Text = "";
            }
            else if (!isStrNull(msg.Text))
            {
                ScriptJS("msgtop('操作失敗','error')");
            }
        }
    }

    #endregion

    #region 刪除
    
    protected void del_Click(object sender, EventArgs e)
    {
        if (language.Del(ValString(Request["code"])))
        {       
            Response.Redirect(Request.Url.AbsolutePath + rtnQueryString("code"));      
        }
        else
        {
            msg.Text = language.log; 
        }
    }


    #endregion



}