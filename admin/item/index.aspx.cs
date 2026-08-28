using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_item_index : ez.admin.PageBase
{

    ez.admin.item item = new ez.admin.item();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            BuildTreeView();
           
            //展開項目
            if (!isStrNull(Request["num"]))
            {
                formPanel.Visible = true;
                formPanel.Enabled = true;

                //載入資料               
                item.num = Val(Request["num"]);
                if (item.load())
                {
                    mode.Value = "edit";
                    title.Value = item.title;
                    url.Value = item.url;
                    other_url.Value = item.other_url;
                    del.Visible = true;
                    HiddenField1.Value = item.title;
                    if (item.root == 0)
                    {
                        iconPanel.Visible = true;                     
                        if (!isStrNull(item.icon)) { icon.Value = item.icon; }
                        sidPanel.Visible = true;
                        if (!isStrNull(item.s_id)) { s_id.Value = item.s_id; }
                        PlaceHolder1.Visible = false;
                    }
                    else
                    {
                        iconPanel.Visible = false;
                        sidPanel.Visible = false;
                        PlaceHolder1.Visible = true;
                        if (!isStrNull(item.part_no)) { part_no.Value = item.part_no; }
                        if (item.chapter.HasValue) { chapter.Value = item.chapter.Value.ToString(); }
                    }
                }
                else
                {
                    msg.Text = item.log;
                    formPanel.Enabled = false;
                }

                
            }
        }
       
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes,1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {

        bool isLastLevel = (level + 1 > item.maxLevel);

        DataTable dt = item.options(RootUid, null);
        if (dt.Rows.Count == 0 && level==1)
        {
            delSelect.Visible = false;
        }      

        for (int i = 0; i < dt.Rows.Count; i++)
        {

            TreeNode newNode = new TreeNode();

            if (ValString(Request["num"]) == dt.Rows[i]["num"].ToString() )
            {
                newNode.Text = "<b><span style=\"color:blue\">" + dt.Rows[i]["title"].ToString() + "</span></b>";
                if (!isLastLevel)
                {
                    addSubOption.Visible = true;
                }
              
            }
            else
            {
                newNode.Text = dt.Rows[i]["title"].ToString();
            }
            newNode.Value = dt.Rows[i]["num"].ToString();
            newNode.ShowCheckBox = true;
            newNode.NavigateUrl = Request.Url.AbsolutePath + "?num=" + dt.Rows[i]["num"].ToString();
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild((int)dt.Rows[i]["num"], newNode.ChildNodes, level + 1);
            }
          

        }

      

    }

    #endregion
    
  
    #region 表單預設

    void defForm()
    {
        title.Value = "";
        url.Value = "";
        other_url.Value = "";
        mode.Value = "";
        msg.Text = "";
        addSubOption.Visible = false;
        del.Visible = false;
        icon.Value = "";
        s_id.Value = "";
        part_no.Value = "";
        chapter.Value = "";
    }

    #endregion

    #region 建立選項

    protected void addRootOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        formPanel.Visible = true;        
        mode.Value = "addRoot";
        Literal1.Text = "建立主選項";
        navDiv.Visible = true;
        iconPanel.Visible = true;
        sidPanel.Visible = true;
        PlaceHolder1.Visible = false;
    }

    protected void addSubOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        mode.Value = "addSub";
        Literal1.Text = "於「" + HiddenField1 .Value +"」底下建立次選項";
        navDiv.Visible = true;
        iconPanel.Visible = false;
        sidPanel.Visible = false;
        PlaceHolder1.Visible = true;
    }

    #endregion
    
    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            item.title = title.Value.Trim();
            item.url = url.Value.Trim();
            item.other_url = other_url.Value.Trim();
            item.icon = icon.Value.Trim();
            item.s_id = s_id.Value.Trim();
            item.part_no = part_no.Value.Trim();
            if (!isStrNull(chapter.Value))
            {
                item.chapter = Val(chapter.Value.Trim());
            }       

            bool subOption = addSubOption.Visible;

            if (mode.Value == "addRoot")
            {
                item.root = 0;
                if (item.add()) { msg.Text = "新增成功"; BuildTreeView(); }
                else { msg.Text = item.log; }
            }
            else if (mode.Value == "addSub")
            {
                item.root = Val(Request["num"]);
                if (item.add()) { msg.Text = "新增成功"; BuildTreeView(); }
                else { msg.Text = item.log; }
            } 
            else if (mode.Value == "edit")
            {
                item.num = Val(Request["num"]);
                if (item.edit()) { msg.Text = "修改成功"; BuildTreeView(); }
                else { msg.Text = item.log; }
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

            addSubOption.Visible = subOption;
          
        }
    }

    #endregion

    #region 刪除
    
    protected void del_Click(object sender, EventArgs e)
    {
        item.num = Val(Request["num"]);
        if (item.del())
        {
            Response.Redirect(Request.Url.AbsolutePath);      
        }
        else
        {
            msg.Text = item.log; 
        }
    }

    protected void delSelect_Click(object sender, EventArgs e)
    {
        int j = 0;
        for (int i = 0; i < TreeView1.CheckedNodes.Count; i++)
        {
            if (TreeView1.CheckedNodes[i].Checked)
            {
                item.num = (Val(TreeView1.CheckedNodes[i].Value));
                item.del();
                j++;
            }
        }

        if (j > 0)
        {
            Response.Redirect(Request.Url.AbsolutePath);      
        }
        else
        {
            ScriptMsg("請勾選要刪除的項目");
        }
    }

    #endregion


}